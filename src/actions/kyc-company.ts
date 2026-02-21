"use server";

import { companyFormSchema } from "@/schemas/company";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ActionState } from "@/types/api";

interface CompanyResult {
  status: string;
  message?: string;
}

export async function submitCompanyAction(
  _prevState: ActionState<CompanyResult>,
  formData: FormData
): Promise<ActionState<CompanyResult>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  const raw = {
    legal_name: formData.get("legal_name") as string,
    trade_name: (formData.get("trade_name") as string) || undefined,
    company_type: formData.get("company_type") as string,
    company_pan: (formData.get("company_pan") as string) || undefined,
    cin: (formData.get("cin") as string) || undefined,
    gstin: (formData.get("gstin") as string) || undefined,
    incorporation_date:
      (formData.get("incorporation_date") as string) || undefined,
    registered_address_line1:
      (formData.get("registered_address_line1") as string) || undefined,
    registered_address_line2:
      (formData.get("registered_address_line2") as string) || undefined,
    registered_city:
      (formData.get("registered_city") as string) || undefined,
    registered_state:
      (formData.get("registered_state") as string) || undefined,
    registered_pincode:
      (formData.get("registered_pincode") as string) || undefined,
  };

  const parsed = companyFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    const { data, ok } = await apiClient.post<{
      success: boolean;
      data?: CompanyResult;
      message?: string;
      error?: string;
    }>("/kyc/company", parsed.data, { headers: { Authorization: `Bearer ${token}` } });

    if (!ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || "Company submission failed",
      };
    }

    return {
      success: true,
      data: { status: data.data?.status ?? "pending" },
    };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

