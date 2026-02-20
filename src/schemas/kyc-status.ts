import { z } from "zod";

export const kycStepStatusEnum = z.enum([
  "not_started",
  "pending",
  "verified",
  "failed",
  "manual_review",
]);

export const organizerVerificationStatusEnum = z.enum([
  "pending",
  "email_verified",
  "mobile_verified",
  "kyc_submitted",
  "verified",
  "rejected",
  "suspended",
]);

export const organizerAppStateEnum = z.enum([
  "onboarding_required",
  "kyc_in_progress",
  "awaiting_admin_review",
  "approved",
  "rejected",
  "blocked",
]);

export const kycOverallStatusSchema = z.object({
  organizer_type: z.enum(["individual", "team", "company"]).nullable(),
  pan_status: kycStepStatusEnum,
  bank_status: kycStepStatusEnum,
  selfie_status: kycStepStatusEnum,
  company_status: kycStepStatusEnum.nullable().optional(),
  overall_status: z.enum([
    "not_started",
    "pending",
    "verified",
    "failed",
    "manual_review",
  ]),
  verification_progress: z.number().optional(),
  organizer_verification_status: organizerVerificationStatusEnum.optional(),
  org_is_verified: z.boolean().optional(),
  organizer_is_active: z.boolean().optional(),
  app_state: organizerAppStateEnum.optional(),
});

export const submitKycSchema = z.object({
  confirmation: z.literal(true, {
    error: "You must confirm the KYC submission",
  }),
});
