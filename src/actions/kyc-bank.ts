"use server";

import { bankFormSchema } from "@/schemas/bank";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ActionState } from "@/types/api";

interface BankResult {
    status: string;
    bank_id?: string;
    masked_account?: string;
    message?: string;
}

export async function pollBankStatusAction(
    bankId: string
): Promise<{ status: string; cashfree_status?: string }> {
    const token = await getAccessToken();
    if (!token) {
        throw new Error("Session expired. Please log in again.");
    }

    try {
        const { data, ok } = await apiClient.get<{
            success: boolean;
            data?: { status: string; cashfree_status?: string };
            error?: string;
            message?: string;
        }>(`/kyc/bank/${bankId}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!ok) {
            throw new Error("Network error while checking bank status");
        }

        if (!data.success || !data.data) {
            throw new Error(data.error || data.message || "Failed to check bank status");
        }

        return data.data;
    } catch (err: any) {
        console.error("pollBankStatusAction error:", err);
        throw new Error(
            err.message || "Unable to verify bank status. Please try again later."
        );
    }
}

export async function submitBankAction(
    _prevState: ActionState<BankResult>,
    formData: FormData
): Promise<ActionState<BankResult>> {
    const token = await getAccessToken();
    if (!token) {
        return {
            success: false,
            error: "Session expired. Please log in again.",
        };
    }

    // Extract values safely (avoid type assertion pitfalls)
    const raw = {
        account_holder_name: formData.get("account_holder_name")?.toString() ?? "",
        account_number: formData.get("account_number")?.toString() ?? "",
        ifsc_code: formData.get("ifsc_code")?.toString() ?? "",
        account_type: (formData.get("account_type")?.toString() ?? "savings").trim(),
        is_primary: true,
    };

    // Zod validation
    const parsed = bankFormSchema.safeParse(raw);

    if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};

        parsed.error.issues.forEach((issue) => {
            const key = issue.path[0]?.toString() ?? "unknown";
            fieldErrors[key] = fieldErrors[key] ?? [];
            fieldErrors[key].push(issue.message);
        });

        return {
            success: false,
            error: "Please check the form fields",
            fieldErrors,
        };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            data?: BankResult;
            message?: string;
            error?: string;
        }>("/kyc/bank", parsed.data, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!ok) {
            return {
                success: false,
                error: "Network error during submission. Please try again.",
            };
        }

        if (!data.success) {
            return {
                success: false,
                error: data.message || data.error || "Bank submission failed",
            };
        }

        return {
            success: true,
            data: {
                status: data.data?.status ?? "pending",
                bank_id: data.data?.bank_id,
                masked_account: data.data?.masked_account,
                message: data.data?.message,
            },
        };
    } catch (err: any) {
        console.error("submitBankAction error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong. Please try again.",
        };
    }
}
