import { create } from "zustand";
import type { OrganizerType, OnboardingStep, KycStepStatus } from "@/types/kyc";

type StepStatus = "not_started" | "in_progress" | "completed" | "failed";

interface OnboardingState {
    currentStep: OnboardingStep;
    organizerType: OrganizerType | null;
    stepStatuses: Record<OnboardingStep, StepStatus>;
    setCurrentStep: (step: OnboardingStep) => void;
    setOrganizerType: (type: OrganizerType) => void;
    markStepCompleted: (step: OnboardingStep) => void;
    markStepFailed: (step: OnboardingStep) => void;
    resetOnboarding: () => void;
    hydrateFromKycStatus: (kycStatus: {
        organizer_type: OrganizerType | null;
        pan_status: KycStepStatus;
        bank_status: KycStepStatus;
        selfie_status: KycStepStatus;
        company_status?: KycStepStatus | null;
        overall_status: string;
        app_state?: string;
    }) => void;
}

const initialStepStatuses: Record<OnboardingStep, StepStatus> = {
    "organizer-type": "not_started",
    "personal-identity": "not_started",
    "selfie-verification": "not_started",
    "company-details": "not_started",
    "bank-account": "not_started",
    review: "not_started",
    status: "not_started",
};

function mapKycToStepStatus(s: KycStepStatus): StepStatus {
    switch (s) {
        case "verified":
            return "completed";
        case "failed":
            return "failed";
        case "pending":
        case "manual_review":
            return "in_progress";
        default:
            return "not_started";
    }
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    currentStep: "organizer-type",
    organizerType: null,
    stepStatuses: { ...initialStepStatuses },

    setCurrentStep: (step) => set({ currentStep: step }),

    setOrganizerType: (type) => set({ organizerType: type }),

    markStepCompleted: (step) =>
        set((state) => {
            if (state.stepStatuses[step] === "completed") return state; // skip if already done
            return {
                stepStatuses: { ...state.stepStatuses, [step]: "completed" },
            };
        }),

    markStepFailed: (step) =>
        set((state) => ({
            stepStatuses: { ...state.stepStatuses, [step]: "failed" },
        })),

    resetOnboarding: () =>
        set({
            currentStep: "organizer-type",
            organizerType: null,
            stepStatuses: { ...initialStepStatuses },
        }),

    hydrateFromKycStatus: (kycStatus) => {
        set({
            organizerType: kycStatus.organizer_type,
            stepStatuses: {
                "organizer-type": kycStatus.organizer_type
                    ? "completed"
                    : "not_started",
                "personal-identity": mapKycToStepStatus(kycStatus.pan_status),
                "selfie-verification": mapKycToStepStatus(kycStatus.selfie_status),
                "company-details": kycStatus.company_status
                    ? mapKycToStepStatus(kycStatus.company_status)
                    : "not_started",
                "bank-account": mapKycToStepStatus(kycStatus.bank_status),
                review:
                    kycStatus.app_state === "awaiting_admin_review" ||
                        kycStatus.app_state === "approved" ||
                        kycStatus.app_state === "rejected" ||
                        kycStatus.app_state === "blocked" ||
                        kycStatus.overall_status === "pending" ||
                        kycStatus.overall_status === "verified"
                        ? "completed"
                        : "not_started",
                status:
                    kycStatus.app_state === "approved"
                        ? "completed"
                        : "not_started",
            },
        });
    },
}));
