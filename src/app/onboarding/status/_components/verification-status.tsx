"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  PartyPopper,
  ShieldX,
} from "lucide-react";

import { useKycStatus } from "@/hooks/use-kyc-status";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import type { KycStepStatus } from "@/types/kyc";

export function VerificationStatus() {
  const router = useRouter();
  const organizerType = useOnboardingStore((s) => s.organizerType);
  const { data: kycStatus, isLoading } = useKycStatus();

  const appState = kycStatus?.app_state;
  const isVerified = appState === "approved";
  const isPending =
    appState === "awaiting_admin_review" ||
    appState === "kyc_in_progress" ||
    kycStatus?.overall_status === "pending" ||
    kycStatus?.overall_status === "manual_review";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (appState === "blocked") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-destructive/15 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Account Blocked</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your organizer account is blocked. Contact Krown support or admin.
          </p>
        </div>
      </div>
    );
  }

  if (appState === "rejected") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">KYC Rejected</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Please recheck your details and resubmit the verification steps.
          </p>
        </div>
        <Button onClick={() => router.push("/onboarding")} className="w-full max-w-sm h-12">
          Re-submit KYC
        </Button>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <div className="absolute -top-2 -right-2">
            <PartyPopper className="w-8 h-8 text-warning" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            You&apos;re Verified!
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            You can now publish events and receive payouts.
          </p>
        </div>

        <Button
          onClick={() => router.push("/admin")}
          className="w-full max-w-sm h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Pending state
  const items: { label: string; status: KycStepStatus }[] = [
    {
      label: "Identity Verified",
      status: kycStatus?.pan_status ?? "not_started",
    },
    ...(organizerType === "company"
      ? [
          {
            label: "Company Details",
            status: (kycStatus?.company_status ?? "not_started") as KycStepStatus,
          },
        ]
      : []),
    {
      label: "Bank Verification",
      status: kycStatus?.bank_status ?? "not_started",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Verification in Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          We&apos;re reviewing your details. This usually takes up to 48 hours.
        </p>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border space-y-4 w-full max-w-sm">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.status === "verified" ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Clock className="w-5 h-5 text-warning" />
            )}
            <p className="text-sm text-foreground">{item.label}</p>
            <span
              className={`text-xs ml-auto ${
                item.status === "verified" ? "text-success" : "text-warning"
              }`}
            >
              {item.status === "verified" ? "Done" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      {isPending && (
        <Button onClick={() => router.refresh()} variant="outline" className="w-full max-w-sm">
          Refresh Status
        </Button>
      )}
    </div>
  );
}
