"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { User, Users, Building2 } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrganizerType } from "@/types/kyc";

const OPTIONS = [
  {
    id: "individual" as OrganizerType,
    icon: User,
    title: "Individual",
    desc: "Solo organizer managing personal events",
  },
  {
    id: "team" as OrganizerType,
    icon: Users,
    title: "Team / Community",
    desc: "Group or community organizing together",
  },
  {
    id: "company" as OrganizerType,
    icon: Building2,
    title: "Registered Company",
    desc: "Legally registered business entity",
  },
] as const;

type State = { selected: OrganizerType | null };
type Action = { type: "SELECT"; value: OrganizerType };

function reducer(_state: State, action: Action): State {
  return { selected: action.value };
}

export function OrganizerTypeForm() {
  const router = useRouter();
  const { setOrganizerType, markStepCompleted } = useOnboardingStore();
  const [state, dispatch] = useReducer(reducer, { selected: null });

  const handleContinue = () => {
    if (!state.selected) return;
    setOrganizerType(state.selected);
    markStepCompleted("organizer-type");
    router.push("/onboarding/personal-identity");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Choose Your Organizer Type
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          This helps us verify your account correctly.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = state.selected === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => dispatch({ type: "SELECT", value: opt.id })}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                isSelected
                  ? "bg-primary/10 border-primary/40"
                  : "bg-card border-border hover:bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected
                    ? "bg-gradient-to-br from-primary to-primary/80"
                    : "bg-secondary"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isSelected
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {opt.title}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary" : "border-muted"
                )}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!state.selected}
        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
      >
        Continue
      </Button>
    </div>
  );
}
