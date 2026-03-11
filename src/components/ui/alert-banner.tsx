import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const alertBannerVariants = cva(
  "rounded-xl flex items-start gap-3 transition-colors",
  {
    variants: {
      variant: {
        warning:
          "bg-warning/10 border border-warning/30 text-foreground",
        danger:
          "bg-destructive/10 border border-destructive/30 text-foreground",
        info: "bg-accent/10 border border-accent/30 text-foreground",
        success:
          "bg-success/10 border border-success/30 text-foreground",
      },
      size: {
        sm: "px-3 py-2",
        md: "p-3",
        lg: "p-4",
      },
    },
    defaultVariants: {
      variant: "warning",
      size: "md",
    },
  }
);

const iconColorMap: Record<string, string> = {
  warning: "bg-warning/20 text-warning",
  danger: "bg-destructive/20 text-destructive",
  info: "bg-accent/20 text-accent",
  success: "bg-success/20 text-success",
};

export interface AlertBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertBannerVariants> {
  /** Lucide icon displayed in a circle */
  icon?: LucideIcon;
  /** Bold title text */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Optional action button */
  action?: { label: string; onClick: () => void };
  /** Optional dismiss handler — shows close button */
  onDismiss?: () => void;
}

const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  (
    {
      className,
      variant,
      size,
      icon: Icon,
      title,
      description,
      action,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const variantKey = variant ?? "warning";
    const sizeKey = size ?? "md";

    return (
      <div
        ref={ref}
        className={cn(alertBannerVariants({ variant, size }), className)}
        {...props}
      >
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              "shrink-0 rounded-full flex items-center justify-center",
              sizeKey === "sm" ? "w-5 h-5" : "w-8 h-8",
              iconColorMap[variantKey]
            )}
          >
            <Icon
              className={sizeKey === "sm" ? "w-3 h-3" : "w-4 h-4"}
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium text-foreground",
              sizeKey === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {title}
          </p>
          {description && (
            <p
              className={cn(
                "text-muted-foreground mt-0.5",
                sizeKey === "sm" ? "text-[10px]" : "text-xs"
              )}
            >
              {description}
            </p>
          )}
          {children}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "font-medium mt-1.5 hover:underline",
                sizeKey === "sm" ? "text-[10px]" : "text-xs",
                variantKey === "warning" && "text-warning",
                variantKey === "danger" && "text-destructive",
                variantKey === "info" && "text-accent",
                variantKey === "success" && "text-success"
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-0.5"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
AlertBanner.displayName = "AlertBanner";

export { AlertBanner, alertBannerVariants };
