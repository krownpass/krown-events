"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    sendPasswordResetOtpAction,
    resetPasswordAction,
} from "@/actions/auth";

type Step = "phone" | "verify" | "success";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("phone");
    const [phone, setPhone] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [otp, setOtp] = useState("");
    const [seconds, setSeconds] = useState(0);

    // Send OTP action
    const [sendState, sendOtp, isSending] = useActionState(
        sendPasswordResetOtpAction,
        { success: false }
    );

    // Reset password action
    const [resetState, resetPassword, isResetting] = useActionState(
        resetPasswordAction,
        { success: false }
    );

    // Handle OTP sent successfully
    useEffect(() => {
        if (sendState.success && sendState.data) {
            setSessionId(sendState.data.session_id);
            setStep("verify");
            setSeconds(30);
        }
    }, [sendState]);

    // Handle password reset successfully
    useEffect(() => {
        if (resetState.success) {
            setStep("success");
        }
    }, [resetState]);

    // Countdown timer
    useEffect(() => {
        if (seconds === 0) return;
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds]);

    // Step 1: Enter phone number
    if (step === "phone") {
        return (
            <div className="space-y-6">
                <div>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to login
                    </Link>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Reset Password
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter your registered mobile number to receive an OTP
                    </p>
                </div>

                {sendState.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{sendState.error}</AlertDescription>
                    </Alert>
                )}

                <form action={sendOtp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Number</Label>
                        <Input
                            id="phone"
                            name="phone"
                            inputMode="numeric"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSending}
                        className="w-full h-12"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending OTP...
                            </>
                        ) : (
                            "Send OTP"
                        )}
                    </Button>
                </form>
            </div>
        );
    }

    // Step 2: Verify OTP and set new password
    if (step === "verify") {
        return (
            <div className="space-y-6">
                <div>
                    <button
                        onClick={() => setStep("phone")}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Change number
                    </button>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Verify & Reset
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter the OTP sent to +91 {phone} and your new password
                    </p>
                </div>

                {resetState.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{resetState.error}</AlertDescription>
                    </Alert>
                )}

                <form action={resetPassword} className="space-y-4">
                    <input type="hidden" name="phone" value={phone} />
                    <input type="hidden" name="session_id" value={sessionId} />

                    <div className="space-y-2">
                        <Label htmlFor="otp">OTP</Label>
                        <Input
                            id="otp"
                            name="otp"
                            inputMode="numeric"
                            placeholder="6-digit OTP"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                            id="new_password"
                            name="new_password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            minLength={8}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isResetting}
                        className="w-full h-12"
                    >
                        {isResetting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        {seconds > 0 ? (
                            <span>Resend OTP in {seconds}s</span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    const fd = new FormData();
                                    fd.append("phone", phone);
                                    sendOtp(fd);
                                    setSeconds(30);
                                }}
                                disabled={isSending}
                                className="text-primary hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </form>
            </div>
        );
    }

    // Step 3: Success
    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Password Reset Successful
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Your password has been changed. Please log in with your new
                    password.
                </p>
            </div>
            <Button
                onClick={() => router.push("/auth/login")}
                className="w-full h-12"
            >
                Go to Login
            </Button>
        </div>
    );
}
