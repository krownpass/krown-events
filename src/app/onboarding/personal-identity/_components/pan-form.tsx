"use client";

import { useActionState, useReducer, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

import { panFormSchema } from "@/schemas/pan";
import type { PanFormInput } from "@/types/kyc";
import type { ActionState } from "@/types/api";
import { submitPanAction } from "@/actions/kyc-pan";
import { useOnboardingStore } from "@/stores/onboarding-store";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PanResult {
    status: string;
    masked_pan?: string;
    name_match?: boolean;
    dob_match?: boolean;
    message?: string;
}

type UIState = { showInfo: boolean };
type UIAction = { type: "TOGGLE_INFO" };

function uiReducer(state: UIState, action: UIAction): UIState {
    switch (action.type) {
        case "TOGGLE_INFO":
            return { showInfo: !state.showInfo };
        default:
            return state;
    }
}

export function PanForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);

    const [ui, dispatch] = useReducer(uiReducer, { showInfo: false });

    const form = useForm<PanFormInput>({
        resolver: zodResolver(panFormSchema),
        mode: "onChange",           // validate as user types → better UX
        defaultValues: {
            pan_number: "",
            name: "",
            date_of_birth: "",
        },
    });

    const [actionState, formAction, isPending] = useActionState<
        ActionState<PanResult>,
        FormData
    >(submitPanAction, { success: false });

    // Redirect / mark complete only once on success
    useEffect(() => {
        if (actionState.success) {
            markStepCompleted("personal-identity");
            queryClient.invalidateQueries({ queryKey: ["kyc"] });
            router.push("/onboarding/selfie-verification");
        }
    }, [actionState.success, markStepCompleted, queryClient, router]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Verify Who You Are
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    We need your PAN for identity verification
                </p>
            </div>

            {actionState.error && (
                <Alert variant="destructive">
                    <AlertDescription>{actionState.error}</AlertDescription>
                </Alert>
            )}

            {/* 
        ── Only action= here ── no conflicting onSubmit handler 
        FormData is built automatically by the browser from the inputs
      */}
            <form action={formAction}>
                <StepCard>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pan_number">PAN Number</Label>
                            <Input
                                id="pan_number"
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                autoComplete="off"
                                {...form.register("pan_number", {
                                    onChange: (e) => {
                                        e.target.value = e.target.value.toUpperCase();
                                    },
                                })}
                                aria-invalid={!!form.formState.errors.pan_number}
                            />
                            {form.formState.errors.pan_number && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.pan_number?.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name as on PAN</Label>
                            <Input
                                id="name"
                                placeholder="Full name"
                                autoComplete="off"
                                {...form.register("name")}
                                aria-invalid={!!form.formState.errors.name}
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.name?.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                            <Input
                                id="date_of_birth"
                                type="date"
                                autoComplete="off"
                                {...form.register("date_of_birth")}
                                aria-invalid={!!form.formState.errors.date_of_birth}
                            />
                            {form.formState.errors.date_of_birth && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.date_of_birth?.message}
                                </p>
                            )}
                        </div>
                    </div>
                </StepCard>

                <button
                    type="button"
                    onClick={() => dispatch({ type: "TOGGLE_INFO" })}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-4"
                >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Why do we need this?
                    {ui.showInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {ui.showInfo && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/50 p-3 rounded-lg mt-2">
                        PAN verification is required by regulatory authorities for financial
                        transactions. Your data is encrypted and stored securely.
                    </p>
                )}

                <Button
                    type="submit"
                    disabled={isPending || !form.formState.isValid}
                    className="w-full h-12 mt-6 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Verifying...
                        </>
                    ) : (
                        "Continue"
                    )}
                </Button>
            </form>
        </div>
    );
}
