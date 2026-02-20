import type { z } from "zod";
import type { panFormSchema } from "@/schemas/pan";
import type { bankFormSchema } from "@/schemas/bank";
import type { companyFormSchema } from "@/schemas/company";
import type { livenessSchema } from "@/schemas/liveness";
import type {
  kycOverallStatusSchema,
  organizerAppStateEnum,
  organizerVerificationStatusEnum,
  kycStepStatusEnum,
} from "@/schemas/kyc-status";

export type PanFormInput = z.infer<typeof panFormSchema>;
export type BankFormInput = z.infer<typeof bankFormSchema>;
export type CompanyFormInput = z.infer<typeof companyFormSchema>;
export type LivenessInput = z.infer<typeof livenessSchema>;
export type KycOverallStatus = z.infer<typeof kycOverallStatusSchema>;
export type KycStepStatus = z.infer<typeof kycStepStatusEnum>;
export type OrganizerVerificationStatus = z.infer<
  typeof organizerVerificationStatusEnum
>;
export type OrganizerAppState = z.infer<typeof organizerAppStateEnum>;

export type OrganizerType = "individual" | "team" | "company";

export type OnboardingStep =
  | "organizer-type"
  | "personal-identity"
  | "selfie-verification"
  | "company-details"
  | "bank-account"
  | "review"
  | "status";
