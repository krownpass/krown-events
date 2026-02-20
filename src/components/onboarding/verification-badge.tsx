import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "not_started" | "pending" | "verified" | "failed" | "manual_review";

interface VerificationBadgeProps {
  status: Status;
  className?: string;
}

const config: Record<
  Status,
  { icon: React.ElementType; label: string; className: string }
> = {
  not_started: {
    icon: Clock,
    label: "Not Started",
    className: "text-muted-foreground",
  },
  pending: {
    icon: Loader2,
    label: "Pending",
    className: "text-warning",
  },
  verified: {
    icon: CheckCircle2,
    label: "Verified",
    className: "text-success",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-destructive",
  },
  manual_review: {
    icon: Clock,
    label: "Under Review",
    className: "text-info",
  },
};

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const { icon: Icon, label, className: statusClassName } = config[status];

  return (
    <div className={cn("flex items-center gap-2 text-sm", statusClassName, className)}>
      <Icon
        className={cn("w-4 h-4", status === "pending" && "animate-spin")}
      />
      <span>{label}</span>
    </div>
  );
}
