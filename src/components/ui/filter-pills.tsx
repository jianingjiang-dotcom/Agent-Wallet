import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface FilterPillItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  /** Optional badge count */
  badge?: number;
}

export interface FilterPillsProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** List of filter options */
  items: FilterPillItem<T>[];
  /** Currently active filter id */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Visual variant */
  variant?: "pill" | "tab";
}

function FilterPillsInner<T extends string = string>(
  {
    className,
    items,
    value,
    onChange,
    variant = "pill",
    ...props
  }: FilterPillsProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  if (variant === "tab") {
    return (
      <div
        ref={ref}
        className={cn(
          "flex bg-muted/50 rounded-lg p-1",
          className
        )}
        {...props}
      >
        {items.map((item) => {
          const isActive = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="min-w-4 h-4 px-1 bg-accent/20 text-accent text-[10px] rounded-full inline-flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pill variant — horizontal scrollable
  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              isActive
                ? "bg-muted text-foreground"
                : "border border-border text-muted-foreground hover:bg-muted/30"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="min-w-4 h-4 px-1 bg-accent/20 text-accent text-[10px] rounded-full inline-flex items-center justify-center font-semibold">
                {item.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ForwardRef wrapper with generic support
const FilterPills = React.forwardRef(FilterPillsInner) as <
  T extends string = string
>(
  props: FilterPillsProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export { FilterPills };
