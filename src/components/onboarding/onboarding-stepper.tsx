"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";
import type { OnboardingStep } from "@/types/kyc";

const STEPS: { key: OnboardingStep; label: string; path: string }[] = [
    {
        key: "organizer-type",
        label: "Organizer Type",
        path: "/onboarding/organizer-type",
    },
    {
        key: "personal-identity",
        label: "PAN Verification",
        path: "/onboarding/personal-identity",
    },
    {
        key: "selfie-verification",
        label: "Selfie Verification",
        path: "/onboarding/selfie-verification",
    },
    {
        key: "company-details",
        label: "Company Details",
        path: "/onboarding/company-details",
    },
    {
        key: "bank-account",
        label: "Bank Account",
        path: "/onboarding/bank-account",
    },
    {
        key: "review",
        label: "Review & Submit",
        path: "/onboarding/review",
    },
];

export function OnboardingStepper() {
    const pathname = usePathname();
    const { stepStatuses, organizerType } = useOnboardingStore();

    const visibleSteps = STEPS.filter((step) => {
        if (step.key === "company-details" && organizerType !== "company") {
            return false;
        }
        return true;
    });

    // Find current step index (1-based)
    const currentStepIndex = visibleSteps.findIndex((step) => step.path === pathname);
    const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
    const totalSteps = visibleSteps.length;

    return (
        <LazyMotion features={domAnimation}>
        <div className="w-full space-y-6 pb-6">
            {/* Header */}
            <div className="flex items-center gap-3 px-1 md:px-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                    <span className="text-primary-foreground font-bold text-base">K</span>
                </div>
                <h2 className="font-semibold text-xl tracking-tight">Onboarding</h2>
            </div>

            {/* Horizontal Stepper */}
            <div className="w-full px-2 sm:px-4">
                <div className="relative">
                    {/* Connector line (background) */}
                    <div className="absolute top-[15px] left-0 right-0 h-[2px] bg-muted/60 rounded-full hidden sm:block" />

                    <div className="flex items-start justify-between relative z-10 gap-1 sm:gap-2">
                        {visibleSteps.map((step, idx) => {
                            const stepNumber = idx + 1;
                            const status = stepStatuses[step.key];
                            const isActive = pathname === step.path;
                            const isCompleted = status === "completed";
                            const isFailed = status === "failed";
                            const isInProgress = status === "in_progress";

                            return (
                                <div
                                    key={step.key}
                                    className={cn(
                                        "flex flex-col items-center flex-1 min-w-0",
                                        idx === visibleSteps.length - 1 && "flex-none"
                                    )}
                                >
                                    <Link
                                        href={step.path}
                                        className={cn(
                                            "group relative flex flex-col items-center focus:outline-none"
                                        )}
                                    >
                                        <m.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.15 : 1,
                                                boxShadow: isActive ? "0 0 0 6px hsl(var(--primary)/0.15)" : "none",
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            className={cn(
                                                "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 shrink-0 z-10",
                                                isCompleted &&
                                                "bg-gradient-primary text-primary-foreground border-transparent",
                                                isFailed &&
                                                "bg-destructive text-destructive-foreground border-destructive",
                                                isInProgress &&
                                                "bg-primary text-primary-foreground border-primary shadow-lg",
                                                !isCompleted &&
                                                !isFailed &&
                                                !isInProgress &&
                                                "bg-muted text-muted-foreground border-muted-foreground/50",
                                                isActive && "ring-2 ring-primary/40"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                                            ) : isFailed ? (
                                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                            ) : (
                                                stepNumber
                                            )}
                                        </m.div>

                                        {/* Connector line between circles - only on desktop */}
                                    </Link>

                                    {/* Label - visible on larger screens */}
                                    <span
                                        className={cn(
                                            "mt-3 text-xs sm:text-sm font-medium text-center leading-tight max-w-[80px] sm:max-w-none hidden sm:block",
                                            isActive ? "text-primary font-semibold" : "text-muted-foreground",
                                            isCompleted && "text-success",
                                            isFailed && "text-destructive"
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile current step info */}
                <div className="text-center mt-4 sm:hidden">
                    <p className="text-sm font-medium text-foreground">
                        {visibleSteps[currentStep - 1]?.label || "Getting started"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Step {currentStep} of {totalSteps}
                    </p>
                </div>
            </div>
        </div>
        </LazyMotion>
    );
}
