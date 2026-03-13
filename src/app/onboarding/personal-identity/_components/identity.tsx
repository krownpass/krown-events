"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    ExternalLink,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
    FileCheck2,
    Clock,
    RefreshCw,
} from "lucide-react";

import { useOnboardingStore } from "@/stores/onboarding-store";
import { useDigiLockerStatus } from "@/hooks/use-digilocker-status";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Types ──────────────────────────────────────────────────────────────

type FlowPhase = "intro" | "consent" | "resolving" | "result";

interface DigiLockerCreateResult {
    verification_id: string;
    reference_id: number;
    url: string;
    status: string;
    documents_requested: string[];
    user_flow: string;
}

interface DocumentResult {
    status: string;
    masked_uid?: string;
    masked_pan?: string;
    masked_dl?: string;
    name?: string;
    dob?: string;
    gender?: string;
    message?: string;
}

interface ResolveResult {
    status: string;
    documents_fetched: string[];
    results: Record<string, DocumentResult>;
}

// ─── Countdown Hook (10 min URL expiry) ─────────────────────────────────

function useCountdown(startedAt: number | null, durationMs: number = 10 * 60 * 1000) {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!startedAt) return;

        const expiresAt = startedAt + durationMs;

        const tick = () => {
            const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setSecondsLeft(diff);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [startedAt, durationMs]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return {
        secondsLeft,
        expired: secondsLeft <= 0 && startedAt !== null,
        display: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    };
}

// ─── Main Component ─────────────────────────────────────────────────────

export function DigiLockerForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);

    const [phase, setPhase] = useState<FlowPhase>("intro");
    const [error, setError] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    // Create URL state
    const [isCreating, startCreating] = useTransition();
    const [createData, setCreateData] = useState<DigiLockerCreateResult | null>(null);
    const [urlCreatedAt, setUrlCreatedAt] = useState<number | null>(null);

    // Resolve state
    const [isResolving, startResolving] = useTransition();
    const [resolveData, setResolveData] = useState<ResolveResult | null>(null);

    // Countdown for 10-minute URL expiry
    const countdown = useCountdown(urlCreatedAt);

    // ── Step 1: Create DigiLocker URL ───────────────────────────────────

    const handleCreateUrl = () => {
        setError(null);

        startCreating(async () => {
            try {
                const redirectUrl = `${window.location.origin}/onboarding/personal-identity`;

                const res = await fetch("/api/kyc/digilocker/create-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        documents_requested: ["AADHAAR", "PAN"],
                        redirect_url: redirectUrl,
                        user_flow: "signup",
                    }),
                });

                const json = await res.json();

                if (!res.ok || !json.success || !json.data?.url) {
                    setError(json.message || json.error || "Failed to create verification URL");
                    return;
                }

                setCreateData(json.data);
                setUrlCreatedAt(Date.now());
                setPhase("consent");

                // Open DigiLocker in a new tab
                window.open(json.data.url, "_blank", "noopener,noreferrer");
            } catch (err: any) {
                setError(err.message || "Something went wrong");
            }
        });
    };

    // ── Step 2: Poll status while user is in DigiLocker ─────────────────

    const verificationId = createData?.verification_id ?? "";

    const shouldPoll =
        phase === "consent" &&
        !!verificationId &&
        !countdown.expired;

    const { data: statusData } = useDigiLockerStatus(
        verificationId,
        shouldPoll
    );

    // Auto-resolve when user comes back authenticated
    useEffect(() => {
        if (statusData?.status === "AUTHENTICATED" && phase === "consent") {
            handleResolve();
        }
        if (statusData?.status === "CONSENT_DENIED") {
            setError("You denied consent in DigiLocker. Please try again.");
            setPhase("intro");
        }
        if (statusData?.status === "EXPIRED") {
            // Let the countdown handle it
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusData?.status]);

    // ── Step 3: Resolve (fetch all docs, determine KYC) ─────────────────

    const handleResolve = useCallback(() => {
        if (!verificationId) return;
        setPhase("resolving");
        setError(null);

        startResolving(async () => {
            try {
                const res = await fetch("/api/kyc/digilocker/resolve", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        verification_id: verificationId,
                    }),
                });

                const json = await res.json();

                if (!res.ok || !json.success || !json.data) {
                    setError(
                        json.message || json.error || "Failed to verify documents"
                    );
                    setPhase("consent"); // Let them retry
                    return;
                }

                setResolveData(json.data);
                setPhase("result");

                // Mark step complete & invalidate cache
                queryClient.invalidateQueries({ queryKey: ["kyc"] });

                const kycStatus = json.data.status;
                if (kycStatus === "verified" || kycStatus === "manual_review") {
                    markStepCompleted("personal-identity");
                }
            } catch (err: any) {
                setError(err.message || "Something went wrong");
                setPhase("consent");
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verificationId]);

    // ── Retry ───────────────────────────────────────────────────────────

    const handleRetry = useCallback(() => {
        setPhase("intro");
        setCreateData(null);
        setUrlCreatedAt(null);
        setResolveData(null);
        setError(null);
    }, []);

    // ── Open DigiLocker URL again ───────────────────────────────────────

    const handleReopenUrl = () => {
        if (createData?.url) {
            window.open(createData.url, "_blank", "noopener,noreferrer");
        }
    };

    // ── Derived state ───────────────────────────────────────────────────

    const aadhaarResult = resolveData?.results?.AADHAAR;
    const panResult = resolveData?.results?.PAN;
    const isVerified = resolveData?.status === "verified";
    const isFailed =
        resolveData?.status === "failed" ||
        (aadhaarResult?.status === "AADHAAR_NOT_LINKED" && !panResult);

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Verify Your Identity
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {phase === "intro" &&
                        "Verify your Aadhaar and PAN instantly via DigiLocker — no document uploads needed."}
                    {phase === "consent" &&
                        "Complete the verification in the DigiLocker window."}
                    {phase === "resolving" && "Fetching your verified documents..."}
                    {phase === "result" && "Verification result"}
                </p>
            </div>

            {/* Global errors */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ── PHASE 1: Intro ─────────────────────────────────────── */}
            {phase === "intro" && (
                <div className="space-y-6">
                    <StepCard>
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        DigiLocker Verification
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Government-verified Aadhaar + PAN in one step
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-3">
                                <p className="font-medium text-foreground">
                                    What happens next
                                </p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>
                                        You&apos;ll be redirected to DigiLocker (government portal)
                                    </li>
                                    <li>
                                        Sign in with your Aadhaar-linked mobile number
                                    </li>
                                    <li>
                                        Grant consent to share your Aadhaar &amp; PAN
                                    </li>
                                    <li>
                                        Come back here — we&apos;ll verify automatically
                                    </li>
                                </ol>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    Aadhaar
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    PAN Card
                                </div>
                            </div>
                        </div>
                    </StepCard>

                    <button
                        type="button"
                        onClick={() => setShowInfo(!showInfo)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Why DigiLocker?
                        {showInfo ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                    </button>

                    {showInfo && (
                        <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/50 p-3 rounded-lg">
                            DigiLocker is a Government of India platform that lets you
                            securely share your official documents. No physical copies or
                            uploads needed. Your data is encrypted and stored securely.
                        </p>
                    )}

                    <Button
                        onClick={handleCreateUrl}
                        disabled={isCreating}
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Setting up...
                            </>
                        ) : (
                            <>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Continue with DigiLocker
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* ── PHASE 2: Consent (waiting for user to complete DigiLocker) ── */}
            {phase === "consent" && (
                <div className="space-y-6">
                    <StepCard>
                        <div className="text-center space-y-4">
                            {countdown.expired ? (
                                <div className="space-y-3">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <XCircle className="h-6 w-6 text-destructive" />
                                    </div>
                                    <p className="text-sm font-medium text-destructive">
                                        Verification link expired
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        DigiLocker URLs are valid for 10 minutes.
                                    </p>
                                    <Button variant="outline" onClick={handleRetry}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Start Over
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            Link expires in{" "}
                                            <span className="font-mono font-semibold text-foreground">
                                                {countdown.display}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="text-sm font-medium text-foreground">
                                            Waiting for DigiLocker verification
                                        </p>
                                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                            Complete the verification in the DigiLocker window
                                            that opened. If it didn&apos;t open, click below.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReopenUrl}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open DigiLocker
                                        </Button>
                                    </div>

                                    {/* Live status indicator */}
                                    {statusData && (
                                        <p className="text-xs text-muted-foreground">
                                            Status:{" "}
                                            <span className="font-medium capitalize">
                                                {statusData.status.toLowerCase().replace("_", " ")}
                                            </span>
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </StepCard>
                </div>
            )}

            {/* ── PHASE 3: Resolving (fetching documents) ────────────── */}
            {phase === "resolving" && (
                <StepCard>
                    <div className="text-center space-y-4 py-6">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Fetching your verified documents
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                This usually takes a few seconds...
                            </p>
                        </div>
                    </div>
                </StepCard>
            )}

            {/* ── PHASE 4: Result ────────────────────────────────────── */}
            {phase === "result" && resolveData && (
                <div className="space-y-6">
                    <StepCard>
                        {(isVerified || resolveData.status === "manual_review") && (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-foreground">
                                        Identity Verified
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Your Aadhaar and PAN have been verified via DigiLocker.
                                    </p>
                                </div>

                                {/* Document results */}
                                <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-3 text-left">
                                    {aadhaarResult && aadhaarResult.status === "SUCCESS" && (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Aadhaar Verified
                                                </p>
                                                {aadhaarResult.name && (
                                                    <p className="text-muted-foreground">
                                                        {aadhaarResult.name}
                                                    </p>
                                                )}
                                                {aadhaarResult.masked_uid && (
                                                    <p className="text-muted-foreground font-mono text-xs">
                                                        UID: {aadhaarResult.masked_uid}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {panResult && panResult.status === "SUCCESS" && (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    PAN Verified
                                                </p>
                                                {panResult.name && (
                                                    <p className="text-muted-foreground">
                                                        {panResult.name}
                                                    </p>
                                                )}
                                                {panResult.masked_pan && (
                                                    <p className="text-muted-foreground font-mono text-xs">
                                                        PAN: {panResult.masked_pan}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() =>
                                        router.push("/onboarding/selfie-verification")
                                    }
                                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                                >
                                    Continue
                                </Button>
                            </div>
                        )}

                        {isFailed && (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <XCircle className="h-7 w-7 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-foreground">
                                        Verification Failed
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {aadhaarResult?.status === "AADHAAR_NOT_LINKED"
                                            ? "Your Aadhaar is not linked to DigiLocker. Please link it at digilocker.gov.in first."
                                            : "Unable to verify your documents. Please try again."}
                                    </p>
                                </div>

                                {/* Show individual doc statuses */}
                                <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2 text-left">
                                    {resolveData.documents_fetched.map((doc) => {
                                        const result = resolveData.results[doc];
                                        if (!result) return null;
                                        const ok = result.status === "SUCCESS";
                                        return (
                                            <div
                                                key={doc}
                                                className="flex items-center gap-2"
                                            >
                                                {ok ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                )}
                                                <span className="text-foreground">
                                                    {doc === "AADHAAR"
                                                        ? "Aadhaar"
                                                        : doc === "PAN"
                                                            ? "PAN"
                                                            : doc}
                                                </span>
                                                <span className="text-muted-foreground ml-auto text-xs">
                                                    {result.status
                                                        .toLowerCase()
                                                        .replace(/_/g, " ")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={handleRetry}
                                    className="w-full h-12"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </StepCard>
                </div>
            )}
        </div>
    );
}
