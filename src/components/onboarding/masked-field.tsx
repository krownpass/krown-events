import { ShieldCheck } from "lucide-react";

interface MaskedFieldProps {
  label: string;
  value: string;
}

export function MaskedField({ label, value }: MaskedFieldProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-success" />
        <span className="text-sm font-mono text-foreground">{value}</span>
      </div>
    </div>
  );
}
