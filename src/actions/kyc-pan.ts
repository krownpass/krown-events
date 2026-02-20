"use server"; // ← This is correct

import { panFormSchema } from "@/schemas/pan";
import { apiClient } from "@/lib/api-client";
// import { getAccessToken } from "@/lib/auth"; // ← you can keep this commented or remove if using cookies directly

import { cookies } from "next/headers";
import type { ActionState } from "@/types/api";

interface PanResult {
    status: string;
    masked_pan?: string;
    name_match?: boolean;
    dob_match?: boolean;
    message?: string;
}

export async function submitPanAction(
    prevState: ActionState<PanResult>,
    formData: FormData
): Promise<ActionState<PanResult>> {
    // ── Fix 1: await cookies() ──
    const cookieStore = await cookies(); // ← this was missing await → Promise, not the actual cookies object

    // Replace "krown_access_token" with your real cookie name
    // Common names: "access_token", "auth_token", "__Secure-next-auth.session-token", etc.
    const token = cookieStore.get("krown_access_token")?.value;

    // Alternative (if your auth logic is more complex):
    // const token = await getAccessToken();

    if (!token) {
        return { success: false, error: "Session expired. Please log in again." };
    }

    const raw = {
        pan_number: formData.get("pan_number") as string,
        name: formData.get("name") as string,
        date_of_birth: formData.get("date_of_birth") as string,
    };

    const parsed = panFormSchema.safeParse(raw);
    if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        parsed.error.issues.forEach((issue) => {
            const key = issue.path[0] as string;
            fieldErrors[key] = fieldErrors[key] || [];
            fieldErrors[key].push(issue.message);
        });
        return { success: false, error: "Validation failed", fieldErrors };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            data?: PanResult;
            message?: string;
            error?: string;
        }>("/kyc/pan", parsed.data, { headers: { Authorization: `Bearer ${token}` } });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.message || data.error || "PAN submission failed",
            };
        }

        return {
            success: true,
            data: data.data ?? {
                status: "pending",
                masked_pan: undefined,
                name_match: undefined,
                dob_match: undefined,
                message: undefined,
            },
        };
    } catch (err) {
        console.error("PAN verification failed:", err);
        return { success: false, error: "Network or server error. Please try again." };
    }
}
