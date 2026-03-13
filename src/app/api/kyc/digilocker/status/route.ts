// ─── app/api/kyc/digilocker/status/route.ts ─────────────────────────────
// Proxies GET /kyc/digilocker/status?verification_id=... to backend

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { COOKIE_NAMES } from "@/lib/constants";

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verificationId = request.nextUrl.searchParams.get("verification_id");
    if (!verificationId) {
        return NextResponse.json(
            { error: "verification_id required" },
            { status: 400 }
        );
    }

    try {
        const { data, status } = await apiClient.get(
            `/kyc/digilocker/status?verification_id=${encodeURIComponent(verificationId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return NextResponse.json(data, { status });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
