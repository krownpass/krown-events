import { apiClient } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface EmailVerificationRequest {
    email: string;
}

export interface EmailVerificationResponse {
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    token: string;
}

export interface VerifyEmailResponse {
    email: string;
    verified: boolean;
}

export interface MobileOtpRequest {
    phone: string;
}

export interface MobileOtpResponse {
    session_id: string;
}

export interface VerifyMobileOtpRequest {
    phone: string;
    otp: string;
    session_id: string;
}

export interface VerifyMobileOtpResponse {
    mobile_number: string;
    verified: boolean;
}

export interface SignupRequest {
    org_name: string;
    email: string;
    password: string;
    mobile_number: string;
    verified_email: string;
    verified_mobile: string;
}

export interface SignupResponse {
    user: {
        org_name: string;
        org_user_id: string;
        email: string;
        mobile_number: string;
        role: string;
        status: string;
    };
}

export interface LoginRequest {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    user: {
        organizerId: string;
        role: string;
        type: "org_user";
    };
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
    refresh_token: string;
}

export interface ForgotPasswordSendRequest {
    phone: string;
}

export interface ForgotPasswordSendResponse {
    session_id: string;
}

export interface ResetPasswordRequest {
    phone: string;
    otp: string;
    session_id: string;
    new_password: string;
}

// ─── Helper ──────────────────────────────────────────
const handleResponse = <T>(response: { data: ApiResponse<T> }): T => {
    if (!response.data.success) {
        throw new Error(
            response.data.error ||
            response.data.message ||
            "Request failed"
        );
    }
    return response.data.data as T;
};

// ─── API Functions ──────────────────────────────────
export const authApi = {
    sendEmailVerification: async (
        data: EmailVerificationRequest
    ): Promise<EmailVerificationResponse> => {
        const response = await apiClient.post<ApiResponse<EmailVerificationResponse>>(
            "/events/auth/email/send",
            data
        );
        return handleResponse(response);
    },

    verifyEmail: async (
        data: VerifyEmailRequest
    ): Promise<VerifyEmailResponse> => {
        const response = await apiClient.post<ApiResponse<VerifyEmailResponse>>(
            "/events/auth/email/verify",
            data
        );
        return handleResponse(response);
    },

    sendMobileOtp: async (
        data: MobileOtpRequest
    ): Promise<MobileOtpResponse> => {
        const response = await apiClient.post<ApiResponse<MobileOtpResponse>>(
            "/events/auth/otp/send-signup",
            data
        );
        return handleResponse(response);
    },

    verifyMobileOtp: async (
        data: VerifyMobileOtpRequest
    ): Promise<VerifyMobileOtpResponse> => {
        const response = await apiClient.post<ApiResponse<VerifyMobileOtpResponse>>(
            "/events/auth/otp/verify-signup",
            data
        );
        return handleResponse(response);
    },

    signup: async (
        data: SignupRequest
    ): Promise<SignupResponse> => {
        const response = await apiClient.post<ApiResponse<SignupResponse>>(
            "/events/auth/signup",
            data
        );
        return handleResponse(response);
    },

    // ✅ Calls Next.js proxy route so cookies are set on frontend domain
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(json.error || "Login failed");
        }

        return json;
    },

    sendLoginOtp: async (
        data: MobileOtpRequest
    ): Promise<MobileOtpResponse> => {
        const response = await apiClient.post<ApiResponse<MobileOtpResponse>>(
            "/events/auth/otp/send",
            data
        );
        return handleResponse(response);
    },

    // ✅ Fixed: was missing the opening `<` on the Promise generic
    verifyLoginOtp: async (
        data: VerifyMobileOtpRequest
    ): Promise<
        | LoginResponse
        | { mobile_verified: boolean; email_verified: boolean }
    > => {
        const response = await apiClient.post<ApiResponse<any>>(
            "/events/auth/otp/verify",
            data
        );
        return handleResponse(response);
    },

    refreshToken: async (
        data: RefreshTokenRequest
    ): Promise<RefreshTokenResponse> => {
        const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
            "/events/auth/refresh-token",
            data
        );
        return handleResponse(response);
    },

    logout: async (refresh_token: string): Promise<void> => {
        await apiClient.post<ApiResponse<void>>(
            "/events/auth/logout",
            { refresh_token }
        );
    },

    sendPasswordResetOtp: async (
        data: ForgotPasswordSendRequest
    ): Promise<ForgotPasswordSendResponse> => {
        const response = await apiClient.post<ApiResponse<ForgotPasswordSendResponse>>(
            "/events/auth/forgot-password/send-otp",
            data
        );
        return handleResponse(response);
    },

    resetPassword: async (
        data: ResetPasswordRequest
    ): Promise<{ message: string }> => {
        const response = await apiClient.post<ApiResponse<{ message: string }>>(
            "/events/auth/forgot-password/reset",
            data
        );
        return handleResponse(response);
    },

    verifyEmailLegacy: async (
        token: string
    ): Promise<{ message: string }> => {
        const response = await apiClient.post<ApiResponse<{ message: string }>>(
            "/events/auth/verify-email",
            { token }
        );
        return handleResponse(response);
    },
};

// ─── Query Keys ─────────────────────────────────────
export const authKeys = {
    all: ["auth"] as const,
    user: () => [...authKeys.all, "user"] as const,
    profile: () => [...authKeys.user(), "profile"] as const,
    sessions: () => [...authKeys.all, "sessions"] as const,
    verification: (type: string) =>
        [...authKeys.all, "verification", type] as const,
};
