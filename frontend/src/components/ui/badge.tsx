import { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        muted: "border-transparent bg-muted text-muted-foreground",
        accent: "border-transparent bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Convenience mapping so callers don't need to know the variant for each status.
export function BookStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    AVAILABLE: "success",
    ISSUED: "accent",
    LOST: "destructive",
    DAMAGED: "warning",
  };
  return <Badge variant={map[status] ?? "muted"}>{status}</Badge>;
}

export function BorrowStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    ISSUED: "accent",
    RETURNED: "success",
    OVERDUE: "destructive",
    LOST: "destructive",
  };
  return <Badge variant={map[status] ?? "muted"}>{status}</Badge>;
}
