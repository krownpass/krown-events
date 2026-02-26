"use server";

import { bankFormSchema } from "@/schemas/bank";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ActionState } from "@/types/api";

export interface RpdCreateResult {
    status: string;
    bank_id?: string;
    ref_id?: number;
    verification_id?: string;
    valid_upto?: string;
    upi_link?: string;
    gpay?: string;
    bhim?: string;
    paytm?: string;
    phonepe?: string;
    qr_code?: string;
}

export async function submitBankAction(
    _prevState: ActionState<RpdCreateResult>,
    formData: FormData
): Promise<ActionState<RpdCreateResult>> {
    const token = await getAccessToken();
    if (!token) {
        return {
            success: false,
            error: "Session expired. Please log in again.",
        };
    }

    const raw = {
        account_holder_name:
            formData.get("account_holder_name")?.toString() ?? "",
    };

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
        // POST /kyc/bank — backend creates Cashfree RPD and returns UPI links
        const { data, ok } = await apiClient.post<{
            success: boolean;
            data?: {
                ref_id: number;
                verification_id: string;
                status: string;
                valid_upto: string;
                upi_link: string;
                gpay: string;
                bhim: string;
                paytm: string;
                phonepe: string;
                qr_code: string;
            };
            message?: string;
            error?: string;
        }>(
            "/kyc/bank",
            { name: parsed.data.account_holder_name },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!ok || !data?.success || !data.data) {
            return {
                success: false,
                error:
                    data?.message ||
                    data?.error ||
                    "Failed to initiate bank verification",
            };
        }

        return {
            success: true,
            data: {
                status: data.data.status,
                ref_id: data.data.ref_id,
                verification_id: data.data.verification_id,
                valid_upto: data.data.valid_upto,
                upi_link: data.data.upi_link,
                gpay: data.data.gpay,
                bhim: data.data.bhim,
                paytm: data.data.paytm,
                phonepe: data.data.phonepe,
                qr_code: data.data.qr_code,
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
