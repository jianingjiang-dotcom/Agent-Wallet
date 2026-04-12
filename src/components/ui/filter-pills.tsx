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
          "flex border-b border-border",
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
                "flex-1 h-11 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 relative",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="min-w-4 h-4 px-1 bg-accent/20 text-accent text-[10px] rounded-full inline-flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-full" />
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
                : "border border-border text-muted-foreground"
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
