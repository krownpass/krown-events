import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/schemas/auth";
import { apiClient } from "@/lib/api-client";

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON" },
                { status: 400 }
            );
        }

        const parsed = verifyOtpSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: "Invalid input", details: parsed.error.format() },
                { status: 400 }
            );
        }

        let backendRes;
        try {
            backendRes = await apiClient.post<{
                success: boolean;
                message?: string;
                error?: string;
                data?: any;
            }>("/api/events/auth/otp/verify", parsed.data);
        } catch (apiErr: any) {
            console.error("[OTP/VERIFY] apiClient failed:", apiErr.message);
            return NextResponse.json(
                {
                    success: false,
                    error: apiErr.message?.includes("ECONN")
                        ? "Backend service unavailable"
                        : "Failed to contact verification service",
                },
                { status: 502 }
            );
        }

        if (!backendRes.ok || !backendRes.data?.success) {
            const errorMsg =
                backendRes.data?.error ||
                backendRes.data?.message ||
                `Verification failed (backend status ${backendRes.status})`;
            return NextResponse.json(
                { success: false, error: errorMsg },
                { status: backendRes.status || 502 }
            );
        }

        return NextResponse.json(backendRes.data);
    } catch (err: any) {
        console.error("[OTP/VERIFY] Handler crash:", err.message);
        return NextResponse.json(
            { success: false, error: "Internal verification error" },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
