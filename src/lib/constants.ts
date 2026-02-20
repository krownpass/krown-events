export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
export const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY || '';

export const COOKIE_NAMES = {
    ACCESS_TOKEN: "krown_access_token",
    REFRESH_TOKEN: "krown_refresh_token",
    CSRF_TOKEN: "csrf_token",
} as const;

export const COOKIE_OPTIONS = {
    ACCESS_TOKEN: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 1800, // 30 minutes (matches backend JWT expiry)
    },
    REFRESH_TOKEN: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 10368000, // 120 days
    },
} as const;

export const ONBOARDING_STEPS = [
    "organizer-type",
    "personal-identity",
    "selfie-verification",
    "company-details",
    "bank-account",
    "review",
    "status",
] as const;

export const PUBLIC_PATHS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/forgot-password",
    "/api/auth",
] as const;
