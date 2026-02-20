import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { COOKIE_NAMES } from "@/lib/constants";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, status } = await apiClient.get<{
            success: boolean;
            data?: {
                organizer_type: "individual" | "team" | "company" | null;
                organizer_verification_status: string;
                org_is_verified: boolean;
                organizer_is_active: boolean;
                app_state: string;
                overall_status: string;
                pan: { status: string };
                bank: { status: string };
                selfie: { status: string };
                company: { status: string } | null;
                verification_progress: number;
            };
            error?: string;
        }>("/kyc/status", { headers: { Authorization: `Bearer ${token}` } });

        if (!data.success || !data.data) {
            return NextResponse.json(
                { error: data.error || "Failed to fetch KYC status" },
                { status }
            );
        }

        const raw = data.data;

        // Flatten nested backend response to match frontend KycOverallStatus schema
        const flat = {
            organizer_type: raw.organizer_type ?? null,
            pan_status: raw.pan?.status ?? "not_started",
            bank_status: raw.bank?.status ?? "not_started",
            selfie_status: raw.selfie?.status ?? "not_started",
            company_status: raw.company?.status ?? null,
            overall_status: raw.overall_status ?? "not_started",
            verification_progress: raw.verification_progress ?? 0,
            organizer_verification_status: raw.organizer_verification_status ?? "pending",
            org_is_verified: Boolean(raw.org_is_verified),
            organizer_is_active: raw.organizer_is_active !== false,
            app_state: raw.app_state ?? "onboarding_required",
        };

        return NextResponse.json({ success: true, data: flat });
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch KYC status" },
            { status: 500 }
        );
    }
}
