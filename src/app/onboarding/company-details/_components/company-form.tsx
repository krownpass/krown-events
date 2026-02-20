"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { companyFormSchema } from "@/schemas/company";
import type { CompanyFormInput } from "@/types/kyc";
import type { ActionState } from "@/types/api";
import { submitCompanyAction } from "@/actions/kyc-company";
import { useOnboardingStore } from "@/stores/onboarding-store";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanyResult {
    status: string;
    message?: string;
}

const COMPANY_TYPES = [
    { value: "private_limited", label: "Private Limited" },
    { value: "public_limited", label: "Public Limited" },
    { value: "llp", label: "LLP" },
    { value: "partnership", label: "Partnership" },
    { value: "proprietorship", label: "Proprietorship" },
    { value: "trust", label: "Trust" },
    { value: "society", label: "Society" },
] as const;

export function CompanyForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);

    const form = useForm<CompanyFormInput>({
        resolver: zodResolver(companyFormSchema),
        defaultValues: {
            legal_name: "",
            trade_name: "",
            company_type: "private_limited",
            company_pan: "",
            cin: "",
            gstin: "",
            incorporation_date: "",
            registered_address_line1: "",
            registered_address_line2: "",
            registered_city: "",
            registered_state: "",
            registered_pincode: "",
        },
        mode: "onChange", // optional: better real-time validation UX
    });

    const [actionState, dispatch, isPending] = useActionState<
        ActionState<CompanyResult>,
        FormData
    >(submitCompanyAction, { success: false });

    const onSubmit = form.handleSubmit((values) => {
        const formData = new FormData();

        // Convert form values to FormData
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        // Important: wrap dispatch in startTransition
        startTransition(() => {
            dispatch(formData);
        });
    });

    // Handle successful submission
    if (actionState.success) {
        markStepCompleted("company-details");
        queryClient.invalidateQueries({ queryKey: ["kyc"] });
        router.push("/onboarding/bank-account");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Tell Us About Your Company
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Required for registered business entities
                </p>
            </div>

            {actionState.error && (
                <Alert variant="destructive">
                    <AlertDescription>{actionState.error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
                <StepCard>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Basic Info
                    </p>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="legal_name">Legal Company Name *</Label>
                            <Input
                                id="legal_name"
                                {...form.register("legal_name")}
                                aria-invalid={!!form.formState.errors.legal_name}
                            />
                            {form.formState.errors.legal_name && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.legal_name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="trade_name">Trade Name (Optional)</Label>
                            <Input {...form.register("trade_name")} id="trade_name" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_type">Company Type *</Label>
                            <select
                                id="company_type"
                                {...form.register("company_type")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {COMPANY_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            {form.formState.errors.company_type && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.company_type.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="incorporation_date">Incorporation Date *</Label>
                            <Input
                                id="incorporation_date"
                                type="date"
                                {...form.register("incorporation_date")}
                            />
                            {form.formState.errors.incorporation_date && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.incorporation_date.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_pan">Company PAN *</Label>
                            <Input
                                id="company_pan"
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                autoComplete="off"
                                {...form.register("company_pan", {
                                    onChange: (e) => {
                                        e.target.value = e.target.value.toUpperCase();
                                    },
                                })}
                            />
                            {form.formState.errors.company_pan && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.company_pan.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cin">CIN / LLPIN</Label>
                            <Input
                                id="cin"
                                autoComplete="off"
                                {...form.register("cin")}
                            />
                            {form.formState.errors.cin && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.cin.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gstin">GSTIN (Optional)</Label>
                            <Input
                                id="gstin"
                                autoComplete="off"
                                {...form.register("gstin")}
                            />
                            {form.formState.errors.gstin && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.gstin.message}
                                </p>
                            )}
                        </div>
                    </div>
                </StepCard>

                <StepCard>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Registered Address
                    </p>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="registered_address_line1">
                                Address Line 1 *
                            </Label>
                            <Input
                                id="registered_address_line1"
                                {...form.register("registered_address_line1")}
                            />
                            {form.formState.errors.registered_address_line1 && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.registered_address_line1.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registered_address_line2">
                                Address Line 2
                            </Label>
                            <Input
                                id="registered_address_line2"
                                {...form.register("registered_address_line2")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="registered_city">City *</Label>
                                <Input
                                    id="registered_city"
                                    {...form.register("registered_city")}
                                />
                                {form.formState.errors.registered_city && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.registered_city.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="registered_state">State *</Label>
                                <Input
                                    id="registered_state"
                                    {...form.register("registered_state")}
                                />
                                {form.formState.errors.registered_state && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.registered_state.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="registered_pincode">Pincode *</Label>
                            <Input
                                id="registered_pincode"
                                maxLength={6}
                                {...form.register("registered_pincode")}
                            />
                            {form.formState.errors.registered_pincode && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.registered_pincode.message}
                                </p>
                            )}
                        </div>
                    </div>
                </StepCard>

                <Button
                    type="submit"
                    disabled={isPending || !form.formState.isValid}
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Submitting...
                        </>
                    ) : (
                        "Continue"
                    )}
                </Button>
            </form>
        </div>
    );
}
