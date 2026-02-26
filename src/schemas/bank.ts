import { z } from "zod";

// ─── Create RPD Request (form input) ─────────────────────────────────────────
// RPD only requires the account holder name. Cashfree extracts bank details
// from the ₹1 UPI payment the user makes.
export const bankFormSchema = z.object({
    account_holder_name: z
        .string()
        .min(2, "Account holder name is required")
        .max(200),
});

// ─── Create RPD Response ─────────────────────────────────────────────────────
export const rpdCreateResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z
        .object({
            ref_id: z.number(),
            verification_id: z.string(),
            status: z.string(),
            valid_upto: z.string(),
            upi_link: z.string(),
            gpay: z.string(),
            bhim: z.string(),
            paytm: z.string(),
            phonepe: z.string(),
            qr_code: z.string(), // base64 QR image
        })
        .optional(),
    error: z.string().optional(),
});

// ─── Poll RPD Status Response ────────────────────────────────────────────────
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
            rpd_status: z.string().optional(),
            masked_account: z.string().optional(),
            masked_ifsc: z.string().optional(),
            name_at_bank: z.string().optional(),
            name_match_score: z.string().optional(),
            name_match_result: z.string().optional(),
            account_type: z.string().optional(),
            reversal_status: z.string().optional(),
            message: z.string().optional(),
        })
        .optional(),
    message: z.string().optional(),
});
