"use server";

import { redirect } from "next/navigation";
import { signupSchema, loginSchema, verifyEmailSchema } from "@/schemas/auth";
import { apiClient } from "@/lib/api-client";
import { setTokenCookies, clearTokenCookies } from "@/lib/auth";
import type { ActionState } from "@/types/api";
import type { AuthUser } from "@/types/auth";

function normalizePhone(raw: FormDataEntryValue | null): string {
    return String(raw ?? "").replace(/\D/g, "");
}

function getPhoneFromFormData(formData: FormData): string {
    return normalizePhone(
        formData.get("phone") ??
        formData.get("mobile") ??
        formData.get("mobile_number")
    );
}

/* ======================================================
   EMAIL VERIFICATION FOR SIGNUP
 ====================================================== */

export async function sendEmailVerificationAction(
    _prevState: ActionState<{ email: string }>,
    formData: FormData
): Promise<ActionState<{ email: string }>> {
    const email = formData.get("email") as string;

    if (!email || !email.includes('@')) {
        return { success: false, error: "Valid email is required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
            data?: { email: string };
        }>("/events/auth/email/send", { email });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Failed to send verification email",
            };
        }

        return {
            success: true,
            data: { email },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Something went wrong",
        };
    }
}

export async function verifyEmailAction(
    _prevState: ActionState<{ email: string }>,
    formData: FormData
): Promise<ActionState<{ email: string }>> {
    const email = formData.get("email") as string;
    const token = formData.get("token") as string;

    if (!email || !token || token.length !== 6) {
        return { success: false, error: "Valid email and 6-digit code required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
            data?: { email: string };
        }>("/events/auth/email/verify", { email, token });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Email verification failed",
            };
        }

        return {
            success: true,
            data: { email: data.data?.email || email },
        };
    } catch {
        return { success: false, error: "Network error. Please try again." };
    }
}

/* ======================================================
   MOBILE OTP FOR SIGNUP
 ====================================================== */

export async function sendOtpSignupAction(
    _prevState: ActionState<{ session_id: string }>,
    formData: FormData
): Promise<ActionState<{ session_id: string }>> {
    const phone = getPhoneFromFormData(formData);

    if (!/^\d{10}$/.test(phone)) {
        return { success: false, error: "Valid 10-digit mobile number required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
            data?: { session_id: string };
        }>("/events/auth/otp/send-signup", { phone });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Failed to send OTP",
            };
        }

        return {
            success: true,
            data: { session_id: data.data?.session_id || "" },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send OTP",
        };
    }
}

export async function verifyOtpSignupAction(
    _prevState: ActionState<AuthUser>,
    formData: FormData
): Promise<ActionState<AuthUser>> {
    const phone = getPhoneFromFormData(formData);
    const session_id = formData.get("session_id") as string;
    const otp = formData.get("otp") as string;

    if (!/^\d{10}$/.test(phone) || !session_id || !otp || otp.length !== 6) {
        return { success: false, error: "Mobile number, session ID and 6-digit OTP required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
        }>("/events/auth/otp/verify-signup", { phone, session_id, otp });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Invalid OTP",
            };
        }

        redirect("/admin/events");
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Verification failed",
        };
    }
}

/* ======================================================
   LOGIN WITH OTP
 ====================================================== */

export async function sendOtpLoginAction(
    _prevState: ActionState<{ session_id: string }>,
    formData: FormData
): Promise<ActionState<{ session_id: string }>> {
    const phone = getPhoneFromFormData(formData);

    if (!/^\d{10}$/.test(phone)) {
        return { success: false, error: "Valid 10-digit mobile number required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
            data?: { session_id: string };
        }>("/events/auth/otp/send", { phone });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Failed to send OTP",
            };
        }

        return {
            success: true,
            data: { session_id: data.data?.session_id || "" },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send OTP",
        };
    }
}

export async function verifyOtpLoginAction(
    _prevState: ActionState<AuthUser>,
    formData: FormData
): Promise<ActionState<AuthUser>> {
    const phone = getPhoneFromFormData(formData);
    const session_id = formData.get("session_id") as string;
    const otp = formData.get("otp") as string;

    if (!/^\d{10}$/.test(phone) || !session_id || !otp || otp.length !== 6) {
        return { success: false, error: "Mobile number, session ID and 6-digit OTP required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            data?: { user: Record<string, unknown>; token: string; refresh_token: string };
            message?: string;
            error?: string;
        }>("/events/auth/otp/verify", { phone, session_id, otp });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Invalid OTP",
            };
        }

        if (data.data?.token) {
            await setTokenCookies(data.data.token, data.data.refresh_token);
        }

        redirect("/onboarding");
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Login failed",
        };
    }
}

/* ======================================================
   RESEND OTP
 ====================================================== */

export async function resendOtpAction(
    _prevState: ActionState<undefined>,
    formData: FormData
): Promise<ActionState<undefined>> {
    const session_id = formData.get("session_id") as string;

    if (!session_id) {
        return { success: false, error: "Session ID required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
        }>("/events/auth/otp/resend", { session_id });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Failed to resend OTP",
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to resend OTP",
        };
    }
}

/* ======================================================
   LOGOUT
 ====================================================== */

export async function logoutAction(): Promise<void> {
    try {
        await apiClient.post("/events/auth/logout");
    } catch {
        // Ignore errors
    } finally {
        await clearTokenCookies();
        redirect("/auth/login");
    }
}

/* ======================================================
   PASSWORD RESET
 ====================================================== */

export async function sendPasswordResetAction(
    _prevState: ActionState<{ session_id: string }>,
    formData: FormData
): Promise<ActionState<{ session_id: string }>> {
    const phone = getPhoneFromFormData(formData);

    if (!/^\d{10}$/.test(phone)) {
        return { success: false, error: "Valid 10-digit mobile number required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
            data?: { session_id: string };
        }>("/events/auth/forgot-password/send-otp", { phone });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Failed to send reset OTP",
            };
        }

        return {
            success: true,
            data: { session_id: data.data?.session_id || "" },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send reset OTP",
        };
    }
}

export async function resetPasswordAction(
    _prevState: ActionState<{ session_id: string }>,
    formData: FormData
): Promise<ActionState<{ session_id: string }>> {
    const phone = getPhoneFromFormData(formData);
    const session_id = formData.get("session_id") as string;
    const otp = formData.get("otp") as string;
    const new_password = formData.get("new_password") as string;

    if (!/^\d{10}$/.test(phone) || !session_id || !otp || otp.length !== 6) {
        return { success: false, error: "Valid OTP required" };
    }

    if (!new_password || new_password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
        }>("/events/auth/forgot-password/reset", { phone, session_id, otp, new_password });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Password reset failed",
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Password reset failed",
        };
    }
}

export async function sendOtpAction(
    _prevState: ActionState<{ session_id: string }>,
    formData: FormData
): Promise<ActionState<{ session_id: string }>> {
    const phone = getPhoneFromFormData(formData);

    if (!/^\d{10}$/.test(phone)) {
        return { success: false, error: "Valid 10-digit mobile number required" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
            data?: { session_id: string };
        }>("/events/auth/otp/send", { phone });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Failed to send OTP",
            };
        }

        return {
            success: true,
            data: { session_id: data.data?.session_id || "" },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send OTP",
        };
    }
}

export async function verifyPasswordResetAction(
    _prevState: ActionState<{ session_id: string }>,
    formData: FormData
): Promise<ActionState<{ session_id: string }>> {
    const phone = getPhoneFromFormData(formData);
    const session_id = formData.get("session_id") as string;
    const otp = formData.get("otp") as string;
    const new_password = formData.get("new_password") as string;

    if (!/^\d{10}$/.test(phone) || !session_id || !otp || otp.length !== 6) {
        return { success: false, error: "Valid OTP required" };
    }

    if (!new_password || new_password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" };
    }

    try {
        const { data, ok } = await apiClient.post<{
            success: boolean;
            message?: string;
            error?: string;
        }>("/events/auth/forgot-password/reset", { phone, session_id, otp, new_password });

        if (!ok || !data.success) {
            return {
                success: false,
                error: data.error || data.message || "Password reset failed",
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Password reset failed",
        };
    }
}

export const sendPasswordResetOtpAction = sendPasswordResetAction;
export const verifyOtpAction = verifyOtpLoginAction;
