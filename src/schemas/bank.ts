import { z } from "zod";

export const bankFormSchema = z.object({
  account_holder_name: z
    .string()
    .min(2, "Account holder name is required")
    .max(200),
  account_number: z
    .string()
    .min(9, "Invalid account number")
    .max(18, "Invalid account number")
    .regex(/^\d+$/, "Account number must contain only digits"),
  ifsc_code: z
    .string()
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
      message: "Invalid IFSC code (e.g., SBIN0001234)",
    }),
  account_type: z.enum(["savings", "current"]),
  is_primary: z.boolean(),
});

export const bankStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      bank_id: z.string().optional(),
      status: z.enum([
        "not_started",
        "pending",
        "verified",
        "failed",
        "manual_review",
      ]),
      masked_account: z.string().optional(),
      bank_name: z.string().optional(),
      branch_name: z.string().optional(),
      name_match_score: z.number().optional(),
      message: z.string().optional(),
    })
    .optional(),
  message: z.string().optional(),
});
