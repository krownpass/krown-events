"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useActionState, startTransition } from "react";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Smartphone,
    QrCode,
    ArrowLeft,
} from "lucide-react";

import { bankFormSchema } from "@/schemas/bank";
import type { ActionState } from "@/types/api";
import { submitBankAction, type RpdCreateResult } from "@/actions/kyc-bank";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useBankStatus, type BankStatusResponse } from "@/hooks/use-bank-status";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type BankFormInput = { account_holder_name: string };
type FlowPhase = "form" | "payment" | "result";

// ─── Countdown Hook ──────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | undefined) {
    const [secondsLeft, setSecondsLeft] = useState<number>(0);

    useEffect(() => {
        if (!expiresAt) return;
        const target = new Date(expiresAt).getTime();
        const tick = () => {
            const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
            setSecondsLeft(diff);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return {
        secondsLeft,
        expired: secondsLeft <= 0 && !!expiresAt,
        display: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    };
}

// ─── UPI App Buttons ─────────────────────────────────────────────────────────

const UPI_APPS = [
    { key: "gpay", label: "Google Pay", color: "#4285F4" },
    { key: "phonepe", label: "PhonePe", color: "#5F259F" },
    { key: "paytm", label: "Paytm", color: "#00BAF2" },
    { key: "bhim", label: "BHIM", color: "#00897B" },
    { key: "upi_link", label: "Other UPI", color: "#6B7280" },
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export function BankForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);

    const [phase, setPhase] = useState<FlowPhase>("form");

    // Track the name value manually so the button enable/disable is reliable
    const [nameValue, setNameValue] = useState("");

    // ── Step 1: Name form ────────────────────────────────────────────────────

    const form = useForm<BankFormInput>({
        resolver: zodResolver(bankFormSchema),
        defaultValues: { account_holder_name: "" },
        mode: "onChange",
    });

    const [actionState, submitAction, isPending] = useActionState<
        ActionState<RpdCreateResult>,
        FormData
    >(submitBankAction, { success: false });

    // Transition to payment phase when RPD is created
    useEffect(() => {
        if (actionState.success && actionState.data?.upi_link) {
            setPhase("payment");
        }
    }, [actionState.success, actionState.data?.upi_link]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = form.getValues("account_holder_name")?.trim();
        if (!name || name.length < 2) return;

        const formData = new FormData();
        formData.append("account_holder_name", name);
        startTransition(() => {
            submitAction(formData);
        });
    };

    // ── Step 2: Payment & Polling ────────────────────────────────────────────

    const countdown = useCountdown(actionState.data?.valid_upto);

    const pollId = actionState.data?.verification_id ?? "";

    const shouldPoll = phase === "payment" && !!pollId && !countdown.expired;

    const { data: bankStatus, isLoading: isPolling } = useBankStatus(
        pollId,
        shouldPoll
    ) as { data: BankStatusResponse | undefined; isLoading: boolean };

    // Transition to result when terminal
    useEffect(() => {
        const s = bankStatus?.status;
        if (s === "verified" || s === "manual_review") {
            setPhase("result");
            queryClient.invalidateQueries({ queryKey: ["kyc"] });
            markStepCompleted("bank-account");
        }
        if (s === "failed") {
            setPhase("result");
        }
    }, [bankStatus?.status, queryClient, markStepCompleted]);

    // ── Reset / Retry ────────────────────────────────────────────────────────

    const handleRetry = useCallback(() => {
        setPhase("form");
        setNameValue("");
        form.reset({ account_holder_name: "" });
    }, [form]);

    // ── Derived state ────────────────────────────────────────────────────────

    const isButtonDisabled = isPending || nameValue.trim().length < 2;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Verify Your Bank Account
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {phase === "form" &&
                        "Enter your name, then make a ₹1 UPI payment to verify ownership. The ₹1 is refunded within 48 hours."}
                    {phase === "payment" &&
                        "Complete the ₹1 UPI payment to verify your bank account."}
                    {phase === "result" && "Bank verification result"}
                </p>
            </div>

            {/* Global errors */}
            {actionState.error && phase === "form" && (
                <Alert variant="destructive">
                    <AlertDescription>{actionState.error}</AlertDescription>
                </Alert>
            )}

            {/* ── PHASE 1: Name Form ─────────────────────────────────────── */}
            {phase === "form" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <StepCard>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="account_holder_name">
                                    Account Holder Name
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Enter the name exactly as it appears in your
                                    bank records
                                </p>
                                <Input
                                    id="account_holder_name"
                                    autoComplete="name"
                                    placeholder="e.g. RAHUL KUMAR"
                                    {...form.register("account_holder_name", {
                                        onChange: (e) => {
                                            setNameValue(e.target.value);
                                        },
                                    })}
                                    aria-invalid={
                                        !!form.formState.errors
                                            .account_holder_name
                                    }
                                />
                                {form.formState.errors.account_holder_name && (
                                    <p className="text-sm text-destructive">
                                        {
                                            form.formState.errors
                                                .account_holder_name.message
                                        }
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
                                <p className="font-medium text-foreground">
                                    How it works
                                </p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>
                                        You&apos;ll make a ₹1 payment via UPI
                                    </li>
                                    <li>
                                        We verify your bank account from the
                                        payment
                                    </li>
                                    <li>₹1 is refunded within 48 hours</li>
                                </ol>
                            </div>
                        </div>
                    </StepCard>

                    <Button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating verification...
                            </>
                        ) : (
                            "Continue to UPI Payment"
                        )}
                    </Button>
                </form>
            )}

            {/* ── PHASE 2: UPI Payment ───────────────────────────────────── */}
            {phase === "payment" && actionState.data && (
                <div className="space-y-6">
                    <StepCard>
                        <div className="text-center space-y-4">
                            {countdown.expired ? (
                                <div className="space-y-3">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <XCircle className="h-6 w-6 text-destructive" />
                                    </div>
                                    <p className="text-sm font-medium text-destructive">
                                        Payment link expired
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={handleRetry}
                                        className="mx-auto"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Try Again
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

                                    <p className="text-lg font-semibold">
                                        Pay ₹1 to verify your account
                                    </p>

                                    {/* QR Code */}
                                    {actionState.data.qr_code && (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 bg-white rounded-xl shadow-sm border">
                                                <img
                                                    src={`data:image/png;base64,${actionState.data.qr_code}`}
                                                    alt="Scan to pay ₹1"
                                                    className="w-48 h-48"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <QrCode className="h-3 w-3" />
                                                Scan with any UPI app
                                            </p>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-xs text-muted-foreground">
                                            or open directly
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>

                                    {/* UPI App buttons */}
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {UPI_APPS.map((app) => {
                                            const link =
                                                actionState.data?.[
                                                app.key as keyof RpdCreateResult
                                                ] as string | undefined;
                                            if (!link) return null;
                                            return (
                                                <a
                                                    key={app.key}
                                                    href={link}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-all",
                                                        "bg-secondary text-foreground hover:opacity-90 active:scale-[0.98]"
                                                    )}
                                                >
                                                    <Smartphone className="h-4 w-4" />
                                                    {app.label}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </StepCard>

                    {/* Polling indicator */}
                    {isPolling && !countdown.expired && (
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Waiting for payment confirmation...
                            </div>
                            {bankStatus?.rpd_status && (
                                <p className="text-xs text-muted-foreground">
                                    Status:{" "}
                                    <span className="font-medium capitalize">
                                        {bankStatus.rpd_status}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── PHASE 3: Result ────────────────────────────────────────── */}
            {phase === "result" && bankStatus && (
                <StepCard>
                    {(bankStatus.status === "verified" ||
                        bankStatus.status === "manual_review") && (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-foreground">
                                        Bank Account Verified
                                    </p>
                                    {bankStatus.name_at_bank && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {bankStatus.name_at_bank}
                                        </p>
                                    )}
                                </div>

                                {(bankStatus.masked_account ||
                                    bankStatus.masked_ifsc) && (
                                        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1 text-left">
                                            {bankStatus.masked_account && (
                                                <p>
                                                    <span className="text-muted-foreground">
                                                        Account:{" "}
                                                    </span>
                                                    <span className="font-mono">
                                                        {bankStatus.masked_account}
                                                    </span>
                                                </p>
                                            )}
                                            {bankStatus.masked_ifsc && (
                                                <p>
                                                    <span className="text-muted-foreground">
                                                        IFSC:{" "}
                                                    </span>
                                                    <span className="font-mono">
                                                        {bankStatus.masked_ifsc}
                                                    </span>
                                                </p>
                                            )}
                                            {bankStatus.account_type && (
                                                <p>
                                                    <span className="text-muted-foreground">
                                                        Type:{" "}
                                                    </span>
                                                    <span className="capitalize">
                                                        {bankStatus.account_type.toLowerCase()}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                <Button
                                    onClick={() =>
                                        router.replace("/onboarding/review")
                                    }
                                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                                >
                                    Continue
                                </Button>
                            </div>
                        )}

                    {bankStatus.status === "failed" && (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                                <XCircle className="h-7 w-7 text-destructive" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground">
                                    Verification Failed
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {bankStatus.message ||
                                        "Please ensure the name matches your bank records exactly and try again."}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleRetry}
                                className="w-full h-12"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    )}
                </StepCard>
            )}
        </div>
    );
}
