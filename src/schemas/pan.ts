import { z } from "zod";

export const panFormSchema = z.object({
  pan_number: z
    .string()
    .min(10, "PAN must be 10 characters")
    .max(10, "PAN must be 10 characters")
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), {
      message:
        "Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)",
    }),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must not exceed 200 characters")
    .transform((val) => val.trim())
    .refine((val) => /^[A-Za-z\s.\-/&]+$/.test(val), {
      message:
        "Name can only contain letters, spaces, dots, hyphens, slashes, and ampersands",
    }),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (val) => {
        const date = new Date(val);
        const now = new Date();
        const minAge = new Date(
          now.getFullYear() - 18,
          now.getMonth(),
          now.getDate()
        );
        const maxAge = new Date(
          now.getFullYear() - 120,
          now.getMonth(),
          now.getDate()
        );
        return date <= minAge && date >= maxAge;
      },
      { message: "Age must be between 18 and 120 years" }
    ),
});

export const panStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      status: z.enum([
        "not_started",
        "pending",
        "verified",
        "failed",
        "manual_review",
      ]),
      masked_pan: z.string().optional(),
      name_match: z.boolean().optional(),
      dob_match: z.boolean().optional(),
      aadhaar_linked: z.boolean().optional(),
      message: z.string().optional(),
    })
    .optional(),
  message: z.string().optional(),
});
