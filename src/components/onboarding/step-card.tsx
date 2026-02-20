import { cn } from "@/lib/utils";

interface StepCardProps {
  children: React.ReactNode;
  className?: string;
}

export function StepCard({ children, className }: StepCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border",
        className
      )}
    >
      {children}
    </div>
  );
}
