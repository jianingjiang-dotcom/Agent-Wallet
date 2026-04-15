import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium",
  {
    variants: {
      variant: {
        success:
          "bg-success/10 text-success",
        warning:
          "bg-warning/10 text-warning",
        danger:
          "bg-destructive/10 text-destructive",
        info: "bg-primary/10 text-primary",
        purple:
          "bg-primary/10 text-primary",
        muted: "bg-muted text-muted-foreground",
        accent: "bg-accent/10 text-accent",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-[11px] px-2 py-0.5",
        lg: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "success",
      size: "md",
    },
  }
);

const iconSizeMap: Record<string, string> = {
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Optional leading icon */
  icon?: LucideIcon;
  /** Badge text content */
  children: React.ReactNode;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, icon: Icon, children, ...props }, ref) => {
    const sizeKey = size ?? "md";

    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && (
          <Icon className={iconSizeMap[sizeKey]} strokeWidth={2} />
        )}
        {children}
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
