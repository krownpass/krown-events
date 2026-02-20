import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/otp",
    "/auth/forgot-password",
];

const ONBOARDING_PATHS = ["/onboarding"];
const PUBLIC_API_PATHS = ["/api/auth"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function tryRefreshToken(
    request: NextRequest,
    redirectPath?: string
): Promise<NextResponse | null> {
    const refreshToken = request.cookies.get("krown_refresh_token")?.value;

    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/events/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) return null;

        const json = await res.json();
        if (!json.success || !json.data) return null;

        const { access_token, refresh_token: newRefreshToken } = json.data;

        // Continue to the requested page with new tokens set
        const response = redirectPath
            ? NextResponse.redirect(new URL(redirectPath, request.url))
            : NextResponse.next();

        response.cookies.set("krown_access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 1800, // 30 minutes
        });

        response.cookies.set("krown_refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 10368000, // 120 days
        });

        return response;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    // CSRF cookie
    if (!request.cookies.get("csrf_token")) {
        response.cookies.set("csrf_token", crypto.randomUUID(), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });
    }

    // Public pages
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return response;
    }

    // Public APIs
    if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
        return response;
    }

    // Onboarding: auth required, no further checks
    if (ONBOARDING_PATHS.some((p) => pathname.startsWith(p))) {
        console.log("🛡️  [MIDDLEWARE] Checking onboarding path:", pathname);
        const token = request.cookies.get("krown_access_token")?.value;
        const refreshToken = request.cookies.get("krown_refresh_token")?.value;

        console.log("🍪 [MIDDLEWARE] Access token:", token ? "✅ Present" : "❌ Missing");
        console.log("🍪 [MIDDLEWARE] Refresh token:", refreshToken ? "✅ Present" : "❌ Missing");
        console.log("🍪 [MIDDLEWARE] All cookies:", request.cookies.getAll().map(c => c.name).join(", "));

        if (!token) {
            console.log("⚠️  [MIDDLEWARE] No access token, trying refresh...");
            // Try refresh before redirecting
            const refreshed = await tryRefreshToken(request, pathname);
            if (refreshed) {
                console.log("✅ [MIDDLEWARE] Token refreshed successfully");
                return refreshed;
            }
            console.log("❌ [MIDDLEWARE] Refresh failed, redirecting to login");
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        console.log("✅ [MIDDLEWARE] Access token found, allowing access");
        return response;
    }

    // Protected routes
    const token = request.cookies.get("krown_access_token")?.value;

    if (!token) {
        // Try refresh before redirecting
        const refreshed = await tryRefreshToken(request, pathname);
        if (refreshed) return refreshed;

        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
    } catch {
        // JWT expired — attempt refresh
        const refreshed = await tryRefreshToken(request);
        if (refreshed) return refreshed;

        // Refresh failed — clear cookies and redirect to login
        const loginUrl = new URL("/auth/login", request.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        redirectResponse.cookies.delete("krown_access_token");
        redirectResponse.cookies.delete("krown_refresh_token");
        return redirectResponse;
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
