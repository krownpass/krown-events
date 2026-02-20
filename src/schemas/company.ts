import { z } from "zod";

export const companyTypeEnum = z.enum([
  "private_limited",
  "public_limited",
  "llp",
  "partnership",
  "proprietorship",
  "trust",
  "society",
]);

export const companyFormSchema = z.object({
  legal_name: z.string().min(2, "Legal name is required").max(255),
  trade_name: z.string().max(255).optional(),
  company_type: companyTypeEnum,
  company_pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  cin: z
    .string()
    .regex(
      /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
      "Invalid CIN format"
    )
    .optional()
    .or(z.literal("")),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format"
    )
    .optional()
    .or(z.literal("")),
  incorporation_date: z.string().optional(),
  registered_address_line1: z.string().max(255).optional(),
  registered_address_line2: z.string().max(255).optional(),
  registered_city: z.string().max(100).optional(),
  registered_state: z.string().max(100).optional(),
  registered_pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Invalid pincode")
    .optional()
    .or(z.literal("")),
});

export const gstinVerifySchema = z.object({
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format"
    ),
});

export const cinVerifySchema = z.object({
  cin: z
    .string()
    .regex(
      /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
      "Invalid CIN format"
    ),
});
