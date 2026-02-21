"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Eye,
    EyeOff,
    Check,
    Mail,
    Phone,
    ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

import { authApi } from "@/actions/auth-api";
import { signupSchema, type SignupInput } from "@/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";

const COOLDOWN_EMAIL_MS = 60_000; // 60 seconds
const COOLDOWN_OTP_MS = 30_000;   // 30 seconds

type VerifyChannel = "email" | "phone";

export function SignupForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [channel, setChannel] = useState<VerifyChannel>("email");
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // ── Per-channel verification state ────────────────────────────────
    const [emailState, setEmailState] = useState({
        sentAt: null as number | null,
        verified: false,
        verifiedValue: null as string | null,
        code: "",
        attempts: 0,
    });

    const [phoneState, setPhoneState] = useState({
        sessionId: null as string | null,
        sentAt: null as number | null,
        verified: false,
        verifiedValue: null as string | null,
        code: "",
        attempts: 0,
    });

    const form = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            org_name: "",
            email: "",
            mobile_number: "",
            password: "",
        },
    });

    const watchEmail = form.watch("email")?.trim();
    const watchMobile = form.watch("mobile_number")?.trim();
    const watchOrg = form.watch("org_name")?.trim();

    // Force countdown update
    const [, tick] = useState(0);
    useEffect(() => {
        if (!emailState.sentAt && !phoneState.sentAt) return;
        const id = setInterval(() => tick((x) => x + 1), 1000);
        return () => clearInterval(id);
    }, [emailState.sentAt, phoneState.sentAt]);

    const emailCooldown = useMemo(
        () =>
            emailState.sentAt
                ? Math.max(0, Math.ceil((COOLDOWN_EMAIL_MS - (Date.now() - emailState.sentAt)) / 1000))
                : 0,
        [emailState.sentAt]
    );

    const phoneCooldown = useMemo(
        () =>
            phoneState.sentAt
                ? Math.max(0, Math.ceil((COOLDOWN_OTP_MS - (Date.now() - phoneState.sentAt)) / 1000))
                : 0,
        [phoneState.sentAt]
    );

    // ── Mutations ─────────────────────────────────────────────────────

    const sendEmailVerification = useMutation({
        mutationFn: authApi.sendEmailVerification,
        onSuccess: () => {
            setEmailState((s) => ({ ...s, sentAt: Date.now(), code: "", attempts: 0 }));
            toast.success("Verification code sent", { description: "Check your inbox" });
        },
        onError: (err: any) =>
            toast.error("Failed to send code", {
                description: err?.message || "Please try again later",
            }),
    });

    const verifyEmail = useMutation({
        mutationFn: authApi.verifyEmail,
        onSuccess: (data) => {
            setEmailState((s) => ({
                ...s,
                verified: true,
                verifiedValue: data.email,
                code: "",
            }));
            toast.success("Email verified");
        },
        onError: (err: any) => {
            setEmailState((s) => ({ ...s, attempts: s.attempts + 1 }));
            toast.error("Invalid code", {
                description: err?.message || "Please check and try again",
            });
        },
    });

    const sendMobileOtp = useMutation({
        mutationFn: authApi.sendMobileOtp,
        onSuccess: (data) => {
            setPhoneState((s) => ({
                ...s,
                sessionId: data.session_id,
                sentAt: Date.now(),
                code: "",
                attempts: 0,
            }));
            toast.success("OTP sent", { description: "Check your messages" });
        },
        onError: (err: any) =>
            toast.error("Failed to send OTP", {
                description: err?.message || "Please try again later",
            }),
    });

    const verifyMobileOtp = useMutation({
        mutationFn: authApi.verifyMobileOtp,
        onSuccess: (data) => {
            setPhoneState((s) => ({
                ...s,
                verified: true,
                verifiedValue: data.mobile_number,
                code: "",
            }));
            toast.success("Mobile number verified");
        },
        onError: (err: any) => {
            setPhoneState((s) => ({ ...s, attempts: s.attempts + 1 }));
            toast.error("Invalid OTP", {
                description: err?.message || "Please check and try again",
            });
        },
    });

    const signupMutation = useMutation({
        mutationFn: authApi.signup,
        onSuccess: (data) => {
            // Note: your current SignupResponse has no token
            // Option A: Redirect to login
            toast.success("Account created successfully! Please log in.");
            router.push("/auth/login");

            // Option B: If you later add token to signup response, uncomment:
            // setAuth(data.user, data.token);
            // router.push("/dashboard");
        },
        onError: (err: any) =>
            toast.error("Account creation failed", {
                description: err?.message || "Please try again",
            }),
    });

    // ── Handlers ──────────────────────────────────────────────────────

    const handleSendCode = () => {
        if (channel === "email") {
            if (!watchEmail) return toast.error("Please enter your email first");
            sendEmailVerification.mutate({ email: watchEmail });
        } else {
            if (!watchMobile || watchMobile.length < 10) {
                return toast.error("Please enter a valid mobile number");
            }
            sendMobileOtp.mutate({ phone: watchMobile });
        }
    };

    const handleVerifyCode = () => {
        if (channel === "email") {
            if (emailState.code.length !== 6) return;
            verifyEmail.mutate({ email: watchEmail!, token: emailState.code });
        } else {
            if (phoneState.code.length !== 6 || !phoneState.sessionId) return;
            verifyMobileOtp.mutate({
                phone: watchMobile!,
                otp: phoneState.code,
                session_id: phoneState.sessionId!,
            });
        }
    };

    const handleSubmit = form.handleSubmit((data) => {
        console.log("Submitting payload:", {
            org_name: data.org_name,
            email: data.email,
            mobile_number: data.mobile_number,
            password: data.password,           // don't log in prod
            verified_email: emailState.verifiedValue,
            verified_mobile: phoneState.verifiedValue,
        });
        if (!emailState.verified || !phoneState.verified) {
            return toast.error("Please verify both email and mobile number");
        }
        if (!termsAccepted) return toast.error("Please accept the terms to continue");

        const payload = {
            org_name: data.org_name,
            email: emailState.verifiedValue!,
            password: data.password,
            mobile_number: phoneState.verifiedValue!,
            verified_email: emailState.verifiedValue!,
            verified_mobile: phoneState.verifiedValue!,
        };
        console.log("Final payload:", JSON.stringify(payload));
        signupMutation.mutate(payload);
    });

    const canSubmit =
        !!watchOrg &&
        form.formState.isValid &&
        emailState.verified &&
        phoneState.verified &&
        termsAccepted &&
        !signupMutation.isPending;

    // ── Render ────────────────────────────────────────────────────────

    return (
        <LazyMotion features={domAnimation}>
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <h1 className="text-2xl font-semibold">Create Organizer Account</h1>
                <p className="text-sm text-muted-foreground">Verify • Secure • Start hosting events</p>
            </div>

            {/* Channel selector */}
            <div className="flex gap-2 rounded-lg bg-muted/60 p-1">
                <Button
                    variant={channel === "email" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setChannel("email")}
                >
                    <Mail className="mr-2 h-4 w-4" /> Email
                </Button>
                <Button
                    variant={channel === "phone" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setChannel("phone")}
                >
                    <Phone className="mr-2 h-4 w-4" /> Phone
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Organization Name */}
                <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input
                        placeholder="Test Org"
                        {...form.register("org_name", { required: "Organization name is required" })}
                    />
                    {form.formState.errors.org_name && (
                        <p className="text-sm text-red-600">{form.formState.errors.org_name.message}</p>
                    )}
                </div>
                {/* Contact + Verification */}
                <AnimatePresence mode="wait">
                    <m.div
                        key={channel}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {channel === "email" ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="organizer@example.com"
                                            disabled={emailState.verified || sendEmailVerification.isPending}
                                            {...form.register("email")}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                !watchEmail ||
                                                sendEmailVerification.isPending ||
                                                emailCooldown > 0 ||
                                                emailState.verified
                                            }
                                            onClick={handleSendCode}
                                        >
                                            {sendEmailVerification.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : emailCooldown > 0 ? (
                                                `Wait ${emailCooldown}s`
                                            ) : emailState.sentAt ? (
                                                "Resend Code"
                                            ) : (
                                                "Send Code"
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {emailState.sentAt && !emailState.verified && (
                                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                            <Label>6-digit code</Label>
                                            <div className="flex gap-2">
                                                <InputOTP
                                                    maxLength={6}
                                                    value={emailState.code}
                                                    onChange={(v) => setEmailState((s) => ({ ...s, code: v }))}
                                                >
                                                    <InputOTPGroup>
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <InputOTPSlot key={i} index={i} />
                                                        ))}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                                <Button
                                                    type="button"
                                                    disabled={emailState.code.length !== 6 || verifyEmail.isPending}
                                                    onClick={handleVerifyCode}
                                                >
                                                    {verifyEmail.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                                </Button>
                                            </div>
                                        </m.div>
                                    )}
                                </AnimatePresence>

                                {emailState.verified && (
                                    <div className="flex items-center justify-between rounded-lg border bg-emerald-50/50 px-3 py-2.5 text-sm">
                                        <div className="flex items-center gap-2 text-emerald-700">
                                            <Check className="h-4 w-4" /> Verified: {emailState.verifiedValue}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() =>
                                                setEmailState({
                                                    sentAt: null,
                                                    verified: false,
                                                    verifiedValue: null,
                                                    code: "",
                                                    attempts: 0,
                                                })
                                            }
                                        >
                                            Change
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Mobile Number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="9876543210"
                                            disabled={phoneState.verified || sendMobileOtp.isPending}
                                            {...form.register("mobile_number")}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                !watchMobile ||
                                                watchMobile.length < 10 ||
                                                sendMobileOtp.isPending ||
                                                phoneCooldown > 0 ||
                                                phoneState.verified
                                            }
                                            onClick={handleSendCode}
                                        >
                                            {sendMobileOtp.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : phoneCooldown > 0 ? (
                                                `Wait ${phoneCooldown}s`
                                            ) : phoneState.sentAt ? (
                                                "Resend OTP"
                                            ) : (
                                                "Send OTP"
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {phoneState.sentAt && !phoneState.verified && (
                                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                            <Label>6-digit OTP</Label>
                                            <div className="flex gap-2">
                                                <InputOTP
                                                    maxLength={6}
                                                    value={phoneState.code}
                                                    onChange={(v) => setPhoneState((s) => ({ ...s, code: v }))}
                                                >
                                                    <InputOTPGroup>
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <InputOTPSlot key={i} index={i} />
                                                        ))}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                                <Button
                                                    type="button"
                                                    disabled={phoneState.code.length !== 6 || verifyMobileOtp.isPending}
                                                    onClick={handleVerifyCode}
                                                >
                                                    {verifyMobileOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                                </Button>
                                            </div>
                                        </m.div>
                                    )}
                                </AnimatePresence>

                                {phoneState.verified && (
                                    <div className="flex items-center justify-between rounded-lg border bg-emerald-50/50 px-3 py-2.5 text-sm">
                                        <div className="flex items-center gap-2 text-emerald-700">
                                            <Check className="h-4 w-4" /> Verified: {phoneState.verifiedValue}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() =>
                                                setPhoneState({
                                                    sessionId: null,
                                                    sentAt: null,
                                                    verified: false,
                                                    verifiedValue: null,
                                                    code: "",
                                                    attempts: 0,
                                                })
                                            }
                                        >
                                            Change
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </m.div>
                </AnimatePresence>

                {/* Password */}
                <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...form.register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {form.formState.errors.password && (
                        <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
                    )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                    <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(v) => setTermsAccepted(!!v)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-tight">
                        I accept the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                        </Link>
                    </Label>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={!canSubmit} className="w-full">
                    {signupMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating…
                        </>
                    ) : canSubmit ? (
                        "Create Organizer Account"
                    ) : (
                        "Complete Email and Mobile verification first"
                    )}
                </Button>
            </form>
        </div>
        </LazyMotion>
    );
}
