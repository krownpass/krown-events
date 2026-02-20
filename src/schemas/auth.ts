import { z } from "zod";

// ─── Updated signup schema for dual verification ────
export const signupSchema = z.object({
    org_name: z.string().min(3, "Minimum 3 characters required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    mobile_number: z.string().min(10, "Mobile number must be at least 10 digits"),
    // These are added during the verification process
    verified_email: z.string().email().optional(),
    verified_mobile: z.string().optional(),
});

// ─── Email verification schemas ─────────────────────
export const sendEmailVerificationSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const verifyEmailForSignupSchema = z.object({
    email: z.string().email("Email is required"),
    token: z.string().length(6, "Verification code must be 6 digits"),
});

// ─── Mobile OTP schemas ─────────────────────────────
export const sendOtpSchema = z.object({
    phone: z.string().min(10, "Valid mobile number is required"),
});

export const verifyOtpSchema = z.object({
    phone: z.string().min(10, "Mobile number is required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    session_id: z.string().min(1, "Session ID is required"),
});

// ─── Existing schemas ───────────────────────────────
export const loginSchema = z.object({
    identifier: z.string().min(1, "Email or mobile number is required"),
    password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
    token: z.string().min(1, "Token is required"),
});

// ─── Type exports ───────────────────────────────────
export type SignupInput = z.infer<typeof signupSchema>;
export type SendEmailVerificationInput = z.infer<typeof sendEmailVerificationSchema>;
export type VerifyEmailForSignupInput = z.infer<typeof verifyEmailForSignupSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
