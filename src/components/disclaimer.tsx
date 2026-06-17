import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function Disclaimer({ className, compact = false }: DisclaimerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900",
        compact ? "p-3 text-xs" : "p-4 text-sm",
        className,
      )}
      role="note"
      aria-label="Safety disclaimer"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>Research workflow demonstration only.</strong> Not for diagnosis
        or treatment decisions. All patient data is synthetic. TrialBridge AI
        supports research coordinators in organizing information and preparing
        cases for human review — it does not diagnose, treat, prescribe, or make
        final medical decisions.
      </p>
    </div>
  );
}
