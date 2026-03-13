
import { z } from "zod";

// ─── Create DigiLocker URL Request ──────────────────────────────────────
export const digilockerFormSchema = z.object({
    redirect_url: z.string().url(),
    documents_requested: z
        .array(z.enum(["AADHAAR", "PAN", "DRIVING_LICENSE"]))
        .min(1, "At least one document is required"),
    user_flow: z.enum(["signin", "signup"]).default("signup"),
});

// ─── Create URL Response ────────────────────────────────────────────────
export const digilockerCreateResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z
        .object({
            verification_id: z.string(),
            reference_id: z.number(),
            url: z.string(),
            status: z.string(),
            documents_requested: z.array(z.string()),
            user_flow: z.string(),
        })
        .optional(),
});

// ─── Status Poll Response ───────────────────────────────────────────────
export const digilockerStatusResponseSchema = z.object({
    success: z.boolean(),
    data: z
        .object({
            verification_id: z.string(),
            reference_id: z.number(),
            status: z.enum([
                "PENDING",
                "AUTHENTICATED",
                "EXPIRED",
                "CONSENT_DENIED",
            ]),
            user_details: z
                .object({
                    name: z.string().optional(),
                    dob: z.string().optional(),
                    gender: z.string().optional(),
                    eaadhaar: z.string().optional(),
                    mobile: z.string().optional(),
                })
                .optional(),
            document_requested: z.array(z.string()).optional(),
            document_consent: z.array(z.string()).nullable().optional(),
            document_consent_validity: z.string().nullable().optional(),
        })
        .optional(),
});

// ─── Resolve Response ───────────────────────────────────────────────────
export const digilockerResolveResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z
        .object({
            status: z.string(),
            documents_fetched: z.array(z.string()),
            results: z.record(
                z.string(),
                z.object({
                    status: z.string(),
                    masked_uid: z.string().optional(),
                    masked_pan: z.string().optional(),
                    masked_dl: z.string().optional(),
                    name: z.string().optional(),
                    dob: z.string().optional(),
                    gender: z.string().optional(),
                    message: z.string().optional(),
                })
            ),
        })
        .optional(),
});
