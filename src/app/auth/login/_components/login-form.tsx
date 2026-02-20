"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { loginSchema } from "@/schemas/auth";
import type { LoginInput } from "@/types/auth";
import { useAuthStore } from "@/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, authKeys } from "@/actions/auth-api";
import { toast } from "sonner";

export function LoginForm() {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    });

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            console.log("🔐 [LOGIN] Success! Response:", data);
            console.log("🔐 [LOGIN] Token in response:", data.token ? "✅ Present" : "❌ Missing");
            console.log("🔐 [LOGIN] Refresh token in response:", data.refresh_token ? "✅ Present" : "❌ Missing");

            // Check current cookies before redirect
            const cookiesBefore = document.cookie;
            console.log("🍪 [LOGIN] Cookies BEFORE redirect:", cookiesBefore);

            // Map the API response to AuthUser type
            setAuth({
                organizerId: data.user.organizer_id,
                role: data.user.role,
                type: "org_user",
            });

            // Invalidate auth queries to refetch user data
            queryClient.invalidateQueries({ queryKey: authKeys.all });

            toast.success("Welcome back!", {
                description: "Setting up your account...",
            });

            // Wait a bit to check if cookies are set
            setTimeout(() => {
                const cookiesAfter = document.cookie;
                console.log("🍪 [LOGIN] Cookies AFTER 500ms:", cookiesAfter);
                console.log("🍪 [LOGIN] Has krown_access_token?", cookiesAfter.includes("krown_access_token") ? "✅ YES" : "❌ NO");
                console.log("🍪 [LOGIN] Has krown_refresh_token?", cookiesAfter.includes("krown_refresh_token") ? "✅ YES" : "❌ NO");

                console.log("🚀 [LOGIN] Redirecting to /onboarding...");
                window.location.href = "/onboarding";
            }, 500);
        },
        onError: (error: any) => {
            console.error("❌ [LOGIN] Error:", error);
            toast.error("Login failed", {
                description: error.message || "Please check your credentials.",
            });
        },
    });

    const handleSubmit = form.handleSubmit((data) => {
        loginMutation.mutate(data);
    });

    // Handle URL search params (e.g., ?signup=success)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('signup') === 'success') {
                toast.success("Account created successfully!", {
                    description: "Please log in with your credentials.",
                });
                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Welcome Back
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Log in to your organizer account
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="identifier">Email or Mobile</Label>
                    <Input
                        id="identifier"
                        placeholder="your@email.com or mobile number"
                        autoComplete="email"
                        disabled={loginMutation.isPending}
                        {...form.register("identifier")}
                    />
                    {form.formState.errors.identifier && (
                        <p className="text-sm text-red-600">
                            {form.formState.errors.identifier.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={loginMutation.isPending}
                        {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                        <p className="text-sm text-red-600">
                            {form.formState.errors.password.message}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <Link
                            href="/auth/forgot-password"
                            className="text-primary hover:text-primary/80"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full h-12"
                >
                    {loginMutation.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Logging in...
                        </>
                    ) : (
                        "Log In"
                    )}
                </Button>

                <div className="text-center">
                    <Button variant="ghost" asChild className="w-full">
                        <Link href="/auth/signup">
                            Don't have an account?{" "}
                            <span className="text-primary ml-1 font-medium">Sign up</span>
                        </Link>
                    </Button>
                </div>

                {/* Alternative Login Options */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <Button variant="outline" asChild className="w-full">
                    <Link href="/auth/otp/send">
                        Login with Mobile OTP
                    </Link>
                </Button>
            </form>
        </div>
    );
}
