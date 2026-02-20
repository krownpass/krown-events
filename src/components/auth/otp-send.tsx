"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendOtpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OtpSend() {
    const router = useRouter();

    const [state, sendOtp, isPending] = useActionState(
        sendOtpAction,
        { success: false }
    );

    // Navigate after OTP sent
    useEffect(() => {
        if (state.success && state.data) {
            const mobile = (
                document.querySelector<HTMLInputElement>('input[name="mobile"]')
            )?.value;

            router.replace(
                `/auth/otp?step=verify&mobile=${mobile}&session_id=${state.data.session_id}`
            );
        }
    }, [state, router]);

    return (
        <form action={sendOtp} className="space-y-6 max-w-sm mx-auto">
            <div>
                <h1 className="text-2xl font-semibold">Login with OTP</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Enter your mobile number to receive an OTP
                </p>
            </div>

            {state.error && (
                <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                    id="mobile"
                    name="mobile"
                    inputMode="numeric"
                    placeholder="9876543210"
                    required
                />
            </div>

            <Button className="w-full h-11" disabled={isPending}>
                {isPending ? "Sending OTP..." : "Send OTP"}
            </Button>
        </form>
    );
}
