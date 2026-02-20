"use client";

import { useReducer, useEffect } from "react"; // ← add useEffect
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle2,
    Clock,
    Pencil,
    Info,
    Loader2,
} from "lucide-react";
import { useKycStatus } from "@/hooks/use-kyc-status";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { submitKycAction } from "@/actions/kyc-submit";
import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { KycStepStatus } from "@/types/kyc";

type State = {
    submitting: boolean;
    error: string | null;
};

type Action =
    | { type: "SUBMIT_START" }
    | { type: "SUBMIT_ERROR"; error: string }
    | { type: "SUBMIT_SUCCESS" };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SUBMIT_START":
            return { submitting: true, error: null };
        case "SUBMIT_ERROR":
            return { submitting: false, error: action.error };
        case "SUBMIT_SUCCESS":
            return { submitting: false, error: null };
    }
}

function StatusIcon({ status }: { status: KycStepStatus }) {
    if (status === "verified") {
        return <CheckCircle2 className="w-5 h-5 text-success" />;
    }
    return <Clock className="w-5 h-5 text-warning" />;
}

export function ReviewSummary() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);
    const organizerType = useOnboardingStore((s) => s.organizerType);
    const { data: kycStatus, isLoading } = useKycStatus();

    const [state, dispatch] = useReducer(reducer, {
        submitting: false,
        error: null,
    });

    const handleSubmit = async () => {
        if (state.submitting) return; // extra guard
        dispatch({ type: "SUBMIT_START" });
        try {
            const result = await submitKycAction();
            if (result.success) {
                dispatch({ type: "SUBMIT_SUCCESS" });
                markStepCompleted("review");
                queryClient.invalidateQueries({ queryKey: ["kyc"] });
                router.push("/onboarding/status");
            } else {
                dispatch({ type: "SUBMIT_ERROR", error: result.error ?? "Submission failed" });
            }
        } catch (err: any) {
            dispatch({ type: "SUBMIT_ERROR", error: err.message || "Unexpected error" });
        }
    };

    // Optional: auto-refresh KYC status if anything is pending
    useEffect(() => {
        if (kycStatus && kycStatus.overall_status === "pending") {
            const timer = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["kyc"] });
            }, 10000); // every 10s

            return () => clearInterval(timer);
        }
    }, [kycStatus, queryClient]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const statusItems = [
        { label: "PAN Verification", status: kycStatus?.pan_status ?? "not_started" },
        { label: "Selfie Verification", status: kycStatus?.selfie_status ?? "not_started" },
        ...(organizerType === "company"
            ? [{ label: "Company Details", status: kycStatus?.company_status ?? "not_started" }]
            : []),
        { label: "Bank Account", status: kycStatus?.bank_status ?? "not_started" },
    ];

    const allStepsCompleted = statusItems.every((item) => item.status !== "not_started" && item.status !== "failed");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Review Your Details
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Make sure everything looks correct before submitting
                </p>
            </div>

            {state.error && (
                <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
                {statusItems.map((item) => (
                    <StepCard key={item.label}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <StatusIcon status={item.status as KycStepStatus} />
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {item.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {item.status.replace("_", " ")}
                                    </p>
                                </div>
                            </div>
                            {(item.status === "not_started" || item.status === "failed") && (
                                <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </StepCard>
                ))}
            </div>

            <div className="bg-primary/5 rounded-lg p-4 flex gap-3 border border-border">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-foreground">
                        Manual Verification
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Your application will be manually verified. This may take up to 2
                        business days.
                    </p>
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={state.submitting || !allStepsCompleted}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
            >
                {state.submitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                    </>
                ) : (
                    "Submit for Verification"
                )}
            </Button>
        </div>
    );
}
