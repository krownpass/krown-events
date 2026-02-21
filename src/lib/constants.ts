export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

