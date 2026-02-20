
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OtpSend } from "@/components/auth/otp-send";
import { OtpVerify } from "@/components/auth/otp-verify";

function OtpPageInner() {
    const params = useSearchParams();

    const step = params.get("step");
    const mobile = params.get("mobile");
    const sessionId = params.get("session_id");

    if (step === "verify" && mobile && sessionId) {
        return <OtpVerify mobile={mobile} sessionId={sessionId} />;
    }

    return <OtpSend />;
}

export default function OtpPage() {
    return (
        <Suspense fallback={<OtpSend />}>
            <OtpPageInner />
        </Suspense>
    );
}
