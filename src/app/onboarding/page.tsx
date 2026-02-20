// app/onboarding/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL, COOKIE_NAMES } from "@/lib/constants";

/* ================= TYPES ================= */

interface KycApiResponse {
    success: boolean;
    data: KycStatus | null;
}

interface KycStatus {
    app_state?:
    | "onboarding_required"
    | "kyc_in_progress"
    | "awaiting_admin_review"
    | "approved"
    | "rejected"
    | "blocked";
    overall_status: "not_started" | "pending" | "verified" | "failed" | "manual_review";

    pan?: { status: "not_started" | "pending" | "verified" | "failed" | "manual_review" };
    selfie?: { status: "not_started" | "pending" | "verified" | "failed" | "manual_review" };
    company?: { status: "not_started" | "pending" | "verified" | "failed" | "manual_review" } | null;
    bank?: { status: "not_started" | "pending" | "verified" | "failed" | "manual_review" };
    verification_progress?: number;
}

/* ================= STEP DECIDER ================= */

function getNextStep(kyc: KycStatus): string {
    if (!kyc.pan || kyc.pan.status === "not_started" || kyc.pan.status === "failed") {
        return "/onboarding/personal-identity";
    }

    if (!kyc.selfie || kyc.selfie.status === "not_started" || kyc.selfie.status === "failed") {
        return "/onboarding/selfie-verification";
    }

    if (
        kyc.company &&
        (kyc.company.status === "not_started" || kyc.company.status === "failed")
    ) {
        return "/onboarding/company-details";
    }

    if (!kyc.bank || kyc.bank.status === "not_started" || kyc.bank.status === "failed") {
        return "/onboarding/bank-account";
    }

    return "/onboarding/status";
}

/* ================= PAGE ================= */

export default async function OnboardingPage() {
    console.log("📄 [ONBOARDING PAGE] Loading...");
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    const allCookies = cookieStore.getAll().map(c => c.name).join(", ");

    console.log("🍪 [ONBOARDING PAGE] Cookie name looking for:", COOKIE_NAMES.ACCESS_TOKEN);
    console.log("🍪 [ONBOARDING PAGE] Token found:", token ? "✅ YES" : "❌ NO");
    console.log("🍪 [ONBOARDING PAGE] All cookies:", allCookies);

    if (!token) {
        console.log("❌ [ONBOARDING PAGE] No token, redirecting to login");
        redirect("/auth/login");
    }

    console.log("✅ [ONBOARDING PAGE] Token present, continuing...");

    // 🔥 Server-side fetch with cookie forwarding
    const response = await fetch(`${API_BASE_URL}/kyc/status`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        redirect("/auth/login");
    }

    const json: KycApiResponse = await response.json();

    if (!json.success || !json.data) {
        redirect("/onboarding/organizer-type");
    }

    const kyc = json.data;

    if (kyc.app_state === "approved") {
        redirect("/admin");
    }

    if (
        kyc.app_state === "awaiting_admin_review" ||
        kyc.app_state === "rejected" ||
        kyc.app_state === "blocked"
    ) {
        redirect("/onboarding/status");
    }

    const nextStep = getNextStep(kyc);
    redirect(nextStep);
}

