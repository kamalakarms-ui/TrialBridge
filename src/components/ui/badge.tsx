import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-teal-100 text-teal-800",
        secondary: "border-transparent bg-slate-100 text-slate-700",
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        danger: "border-transparent bg-red-100 text-red-800",
        outline: "text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function matchStatusBadge(status: string) {
  switch (status) {
    case "likely_eligible":
      return "success" as const;
    case "possibly_eligible":
      return "warning" as const;
    case "not_eligible":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
}

export function matchStatusLabel(status: string) {
  switch (status) {
    case "likely_eligible":
      return "Likely Eligible";
    case "possibly_eligible":
      return "Possibly Eligible";
    case "not_eligible":
      return "Not Eligible";
    default:
      return status;
  }
}

export function taskStatusLabel(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export { Badge, badgeVariants };
