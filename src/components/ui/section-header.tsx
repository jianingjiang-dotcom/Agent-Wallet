import * as React from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional leading icon */
  icon?: LucideIcon;
  /** Section title text */
  title: string;
  /** Optional right-side action button */
  action?: { label: string; onClick: () => void };
  /** Size variant */
  size?: "sm" | "md";
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    { className, icon: Icon, title, action, size = "sm", ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between",
          size === "sm" ? "mb-2 px-1" : "mb-3 px-1",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-1.5">
          {Icon && (
            <Icon
              className={cn(
                "text-muted-foreground",
                size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
              )}
              strokeWidth={1.5}
            />
          )}
          <h3
            className={cn(
              "font-medium text-muted-foreground",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {title}
          </h3>
        </div>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              "font-medium text-accent hover:text-accent/80 transition-colors",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
