"use client";

import { useReducer } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useActionState, startTransition } from "react";
import { Loader2 } from "lucide-react";

import { bankFormSchema } from "@/schemas/bank";
import type { BankFormInput } from "@/types/kyc";
import type { ActionState } from "@/types/api";
import { submitBankAction } from "@/actions/kyc-bank";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useBankStatus } from "@/hooks/use-bank-status";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface BankResult {
    status: string;
    bank_id?: string;
    masked_account?: string;
    message?: string;
}

type UIState = { accountType: "savings" | "current" };
type UIAction = { type: "SET_ACCOUNT_TYPE"; value: "savings" | "current" };

function uiReducer(state: UIState, action: UIAction): UIState {
    switch (action.type) {
        case "SET_ACCOUNT_TYPE":
            return { accountType: action.value };
        default:
            return state;
    }
}

export function BankForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);

    const [ui, dispatchUi] = useReducer(uiReducer, { accountType: "savings" });

    const form = useForm<BankFormInput>({
        resolver: zodResolver(bankFormSchema),
        defaultValues: {
            account_holder_name: "",
            account_number: "",
            ifsc_code: "",
            account_type: "savings",
            is_primary: true,
        },
    });

    const [actionState, submitAction, isPending] = useActionState<
        ActionState<BankResult>,
        FormData
    >(submitBankAction, { success: false });

    const bankId = actionState.data?.bank_id ?? "";
    const shouldPoll =
        actionState.success &&
        (actionState.data?.status === "pending" || actionState.data?.status === "manual_review") &&
        !!bankId &&
        bankId !== "undefined";

    const { data: bankStatus, isLoading: isPolling } = useBankStatus(bankId, shouldPoll);

    // When bank step is accepted (manual review / verified) → continue
    const effectiveBankStatus = bankStatus?.status ?? actionState.data?.status;
    if (actionState.success && (effectiveBankStatus === "verified" || effectiveBankStatus === "manual_review" || effectiveBankStatus === "pending")) {
        queryClient.invalidateQueries({ queryKey: ["kyc"] });
        markStepCompleted("bank-account");
        router.replace("/onboarding/review");
    }

    const pollFailed =
        bankStatus?.status === "failed" ||
        bankStatus?.status === "rejected";
    const currentBankStatus = bankStatus?.status ?? actionState.data?.status;

    const handleSubmit = form.handleSubmit(() => {
        const formData = new FormData();
        formData.append("account_holder_name", form.getValues("account_holder_name") || "");
        formData.append("account_number", form.getValues("account_number") || "");
        formData.append("ifsc_code", form.getValues("ifsc_code") || "");
        formData.append("account_type", ui.accountType);
        formData.append("is_primary", "true");

        startTransition(() => {
            submitAction(formData);
        });
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Where Should We Send Your Money?
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Add your bank details for payouts
                </p>
            </div>

            {actionState.error && (
                <Alert variant="destructive">
                    <AlertDescription>{actionState.error}</AlertDescription>
                </Alert>
            )}

            {pollFailed && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Bank verification failed.
                        {bankStatus?.message ? (
                            <> Reason: {bankStatus.message}</>
                        ) : (
                            <> Please check your account details (name must match exactly at bank) and try again.</>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <StepCard>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="account_holder_name">Account Holder Name</Label>
                            <Input
                                id="account_holder_name"
                                autoComplete="off"
                                {...form.register("account_holder_name")}
                                aria-invalid={!!form.formState.errors.account_holder_name}
                            />
                            {form.formState.errors.account_holder_name && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.account_holder_name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account_number">Account Number</Label>
                            <Input
                                id="account_number"
                                type="password"
                                autoComplete="off"
                                {...form.register("account_number")}
                                aria-invalid={!!form.formState.errors.account_number}
                            />
                            {form.formState.errors.account_number && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.account_number.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ifsc_code">IFSC Code</Label>
                            <Input
                                id="ifsc_code"
                                placeholder="e.g. SBIN0001234"
                                autoComplete="off"
                                {...form.register("ifsc_code", {
                                    onChange: (e) => {
                                        e.target.value = e.target.value.toUpperCase().trim();
                                    },
                                })}
                                aria-invalid={!!form.formState.errors.ifsc_code}
                            />
                            {form.formState.errors.ifsc_code && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.ifsc_code.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label className="mb-2 block">Account Type</Label>
                            <div className="flex gap-3">
                                {(["savings", "current"] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            dispatchUi({ type: "SET_ACCOUNT_TYPE", value: type });
                                            form.setValue("account_type", type);
                                        }}
                                        className={cn(
                                            "flex-1 h-12 rounded-xl text-sm font-medium capitalize transition-all",
                                            ui.accountType === type
                                                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-sm"
                                                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </StepCard>

                <Button
                    type="submit"
                    disabled={
                        isPending ||
                        isPolling ||
                        !form.formState.isValid ||
                        form.formState.isSubmitting
                    }
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Submitting...
                        </>
                    ) : isPolling ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Verifying bank account...
                        </>
                    ) : (
                        "Save & Continue"
                    )}
                </Button>

                {isPolling && currentBankStatus && currentBankStatus !== "verified" && (
                    <p className="text-sm text-center text-muted-foreground mt-3">
                        Current status: <span className="font-medium capitalize">{currentBankStatus}</span>
                        <br />
                        Checking every few seconds...
                    </p>
                )}
            </form>
        </div>
    );
}
