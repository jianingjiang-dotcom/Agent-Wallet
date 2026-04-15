import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const iconCircleVariants = cva(
  "rounded-full flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
        "2xl": "w-20 h-20",
      },
      color: {
        muted: "bg-muted text-muted-foreground",
        accent: "bg-accent/10 text-accent",
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/20 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        trust: "bg-trust/10 text-trust",
        blue: "bg-primary/10 text-primary",
        emerald: "bg-success/10 text-success",
        purple: "bg-primary/10 text-primary",
        amber: "bg-warning/80/10 text-warning",
        red: "bg-destructive/80/10 text-destructive",
      },
    },
    defaultVariants: {
      size: "md",
      color: "accent",
    },
  }
);

const iconSizeMap: Record<string, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
};

export interface IconCircleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconCircleVariants> {
  icon: LucideIcon;
  iconClassName?: string;
}

const IconCircle = React.forwardRef<HTMLDivElement, IconCircleProps>(
  ({ className, size, color, icon: Icon, iconClassName, ...props }, ref) => {
    const sizeKey = size ?? "md";
    return (
      <div
        ref={ref}
        className={cn(iconCircleVariants({ size, color }), className)}
        {...props}
      >
        <Icon
          className={cn(iconSizeMap[sizeKey], iconClassName)}
          strokeWidth={1.5}
        />
      </div>
    );
  }
);
IconCircle.displayName = "IconCircle";

export { IconCircle, iconCircleVariants };
