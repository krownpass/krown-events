"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { verifyOtpAction, sendOtpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OtpVerify({
    mobile,
    sessionId,
}: {
    mobile: string;
    sessionId: string;
}) {
    const router = useRouter();
    const [seconds, setSeconds] = useState(30);

    const [verifyState, verifyOtp, isVerifying] =
        useActionState(verifyOtpAction, { success: false });

    const [, resendOtp, isResending] =
        useActionState(sendOtpAction, { success: false });

    // Countdown
    useEffect(() => {
        if (seconds === 0) return;
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds]);

    // Login success
    useEffect(() => {
        if (verifyState.success && verifyState.data) {
            router.replace("/onboarding");
        }
    }, [verifyState, router]);

    return (
        <form action={verifyOtp} className="space-y-6 max-w-sm mx-auto">
            <input type="hidden" name="mobile" value={mobile} />
            <input type="hidden" name="session_id" value={sessionId} />

            <div>
                <h1 className="text-2xl font-semibold">Enter OTP</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Sent to +91 {mobile}
                </p>
            </div>

            {verifyState.error && (
                <Alert variant="destructive">
                    <AlertDescription>{verifyState.error}</AlertDescription>
                </Alert>
            )}

            <Input
                name="otp"
                placeholder="6-digit OTP"
                inputMode="numeric"
                maxLength={6}
                required
            />

            <Button className="w-full h-11" disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="flex justify-between text-sm text-muted-foreground">
                <button
                    type="button"
                    onClick={() => router.replace("/auth/otp")}
                    className="hover:underline"
                >
                    Change number
                </button>

                {seconds > 0 ? (
                    <span>Resend in {seconds}s</span>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            const fd = new FormData();
                            fd.append("mobile", mobile);
                            resendOtp(fd);
                            setSeconds(30);
                        }}
                        disabled={isResending}
                        className="text-primary hover:underline"
                    >
                        Resend OTP
                    </button>
                )}
            </div>
        </form>
    );
}
