import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/otp",
    "/auth/forgot-password",
];

const PROTECTED_PATHS = [
    "/onboarding",
    "/admin",
    "/dashboard",
];

const isProd = process.env.NODE_ENV === "production";

const accessTokenCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 30,
};

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 120,
};

async function tryRefreshToken(
    request: NextRequest,
    redirectPath?: string
): Promise<NextResponse | null> {
    const refreshToken = request.cookies.get("krown_refresh_token")?.value;
    console.log("[MIDDLEWARE] tryRefreshToken - refresh token present:", !!refreshToken);
    if (!refreshToken) return null;

    try {
        const refreshUrl = isProd
            ? "https://api.krownpass.com/api/events/auth/refresh-token"
            : "http://localhost:4000/api/events/auth/refresh-token";

        const res = await fetch(refreshUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        console.log("[MIDDLEWARE] Refresh response status:", res.status);
        if (!res.ok) return null;

        const json = await res.json();
        console.log("[MIDDLEWARE] Refresh response success:", json.success);
        if (!json.success || !json.data) return null;

        const { access_token, refresh_token: newRefreshToken } = json.data;
        console.log("[MIDDLEWARE] Got new access token:", !!access_token);

        const response = redirectPath
            ? NextResponse.redirect(new URL(redirectPath, request.url))
            : NextResponse.next();

        response.cookies.set("krown_access_token", access_token, accessTokenCookieOptions);
        response.cookies.set("krown_refresh_token", newRefreshToken, refreshTokenCookieOptions);

        return response;
    } catch (err) {
        console.log("[MIDDLEWARE] Refresh error:", err);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 🔍 Log ALL cookies on every protected request
    const allCookies = request.cookies.getAll();
    console.log(`[MIDDLEWARE] ========== ${pathname} ==========`);
    console.log("[MIDDLEWARE] All cookies:", allCookies.map(c => c.name));
    console.log("[MIDDLEWARE] NODE_ENV:", process.env.NODE_ENV);
    console.log("[MIDDLEWARE] JWT_SECRET set:", !!process.env.JWT_SECRET);

    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    if (!isProtected) {
        return NextResponse.next();
    }

    const token = request.cookies.get("krown_access_token")?.value;
    console.log("[MIDDLEWARE] Access token present:", !!token);

    if (!token) {
        console.log("[MIDDLEWARE] No access token, trying refresh...");
        const refreshed = await tryRefreshToken(request, pathname);
        if (refreshed) {
            console.log("[MIDDLEWARE] Refresh succeeded, redirecting to:", pathname);
            return refreshed;
        }
        console.log("[MIDDLEWARE] Refresh failed, redirecting to login");
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        console.log("[MIDDLEWARE] JWT valid ✅");
        return NextResponse.next();
    } catch (err) {
        console.log("[MIDDLEWARE] JWT invalid:", err);
        const refreshed = await tryRefreshToken(request, pathname);
        if (refreshed) return refreshed;

        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("krown_access_token");
        response.cookies.delete("krown_refresh_token");
        return response;
    }
}

export const config = {
    matcher: [
        "/onboarding/:path*",
        "/admin/:path*",
        "/dashboard/:path*",
    ],
};
