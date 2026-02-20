"use client";

import { useRouter } from "next/navigation";
import { usePanStatus } from "@/hooks/use-pan-status";
import { useAuth } from "@/hooks/use-auth";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { VerificationBadge } from "@/components/onboarding/verification-badge";
import { MaskedField } from "@/components/onboarding/masked-field";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/onboarding/step-card";
import { Loader2 } from "lucide-react";
import type { KycStepStatus } from "@/types/kyc";

export function PanStatusPoller() {
  const router = useRouter();
  const { user } = useAuth();
  const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);
  const organizerId = user?.organizerId ?? "";

  const { data, isLoading } = usePanStatus(organizerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = (data?.status ?? "pending") as KycStepStatus;

  if (status === "verified") {
    markStepCompleted("personal-identity");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          PAN Verification Status
        </h1>
      </div>

      <StepCard>
        <div className="space-y-4">
          <VerificationBadge status={status} />
          {data?.masked_pan && (
            <MaskedField label="PAN Number" value={data.masked_pan} />
          )}
          {status === "pending" && (
            <p className="text-sm text-muted-foreground">
              Verification in progress. This usually takes a few seconds.
            </p>
          )}
        </div>
      </StepCard>

      {status === "verified" && (
        <Button
          onClick={() => router.push("/onboarding/selfie-verification")}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
        >
          Continue
        </Button>
      )}

      {status === "failed" && (
        <Button
          onClick={() => router.refresh()}
          variant="outline"
          className="w-full"
        >
          Retry Verification
        </Button>
      )}
    </div>
  );
}
