import type { z } from "zod";
import type {
  loginSchema,
  signupSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "@/schemas/auth";

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type TokenPayload = {
  user_id: string;
  organizer_id?: string;
  role: string;
  type?: string;
  iat?: number;
  exp?: number;
};

/** Non-sensitive user info safe for client-side state */
export type AuthUser = {
  organizerId: string;
  role: string;
  type: string;
};
