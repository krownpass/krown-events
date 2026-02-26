"use server";

import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ActionState } from "@/types/api";

// ─── Types ──────────────────────────────────────────────────────────────

export interface DigiLockerCreateResult {
    verification_id: string;
    reference_id: number;
    url: string;
    status: string;
    documents_requested: string[];
    user_flow: string;
}

export interface DigiLockerResolveResult {
    status: string;
    documents_fetched: string[];
    results: Record<
        string,
        {
            status: string;
            masked_uid?: string;
            masked_pan?: string;
            masked_dl?: string;
            name?: string;
            dob?: string;
            gender?: string;
            message?: string;
        }
    >;
}

// ─── Create DigiLocker URL ──────────────────────────────────────────────

export async function createDigiLockerUrlAction(
    _prevState: ActionState<DigiLockerCreateResult>,
    formData: FormData
): Promise<ActionState<DigiLockerCreateResult>> {
    const token = await getAccessToken();
    if (!token) {
        return { success: false, error: "Session expired. Please log in again." };
    }

    const redirectUrl = formData.get("redirect_url")?.toString() ?? "";
    const docsRaw = formData.get("documents_requested")?.toString() ?? "";

    if (!redirectUrl || !docsRaw) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            data?: DigiLockerCreateResult;
            message?: string;
            error?: string;
        }>("/kyc/digilocker/create-url", {
            documents_requested: docsRaw.split(","),
            redirect_url: redirectUrl,
            user_flow: "signup",
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!ok || !data?.success || !data.data) {
            return {
                success: false,
                error: data?.message || data?.error || "Failed to create DigiLocker URL",
            };
        }

        return { success: true, data: data.data };
    } catch (err: any) {
        console.error("createDigiLockerUrlAction error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong. Please try again.",
        };
    }
}

// ─── Resolve DigiLocker ─────────────────────────────────────────────────

export async function resolveDigiLockerAction(
    verificationId: string
): Promise<ActionState<DigiLockerResolveResult>> {
    const token = await getAccessToken();
    if (!token) {
        return { success: false, error: "Session expired. Please log in again." };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            data?: DigiLockerResolveResult;
            message?: string;
            error?: string;
        }>("/kyc/digilocker/resolve", {
            verification_id: verificationId,
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!ok || !data?.success || !data.data) {
            return {
                success: false,
                error: data?.message || data?.error || "Failed to resolve DigiLocker verification",
            };
        }

        return { success: true, data: data.data };
    } catch (err: any) {
        console.error("resolveDigiLockerAction error:", err);
        return {
            success: false,
            error: err.message || "Something went wrong. Please try again.",
        };
    }
}
