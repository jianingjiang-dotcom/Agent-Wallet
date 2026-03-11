import * as React from "react";
import { ChevronRight } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { IconCircle, type IconCircleProps } from "./icon-circle";

export interface ListItemProps extends React.HTMLAttributes<HTMLElement> {
  /** Lucide icon or custom ReactNode for the left icon */
  icon?: LucideIcon | React.ReactNode;
  /** Color variant for the icon circle (only when icon is a LucideIcon) */
  iconColor?: IconCircleProps["color"];
  /** Size variant for the icon circle */
  iconSize?: IconCircleProps["size"];
  /** Primary text */
  title: string;
  /** Secondary text below the title */
  subtitle?: string;
  /** Value displayed on the right side */
  value?: string | React.ReactNode;
  /** Additional className for the value element */
  valueClassName?: string;
  /** Custom trailing content (e.g., Switch, Badge) */
  trailing?: React.ReactNode;
  /** Show right chevron arrow */
  showChevron?: boolean;
  /** Show bottom border divider */
  showDivider?: boolean;
  /** Red destructive styling */
  destructive?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
}

const ListItem = React.forwardRef<HTMLElement, ListItemProps>(
  (
    {
      className,
      icon,
      iconColor,
      iconSize = "sm",
      title,
      subtitle,
      value,
      valueClassName,
      trailing,
      showChevron = false,
      showDivider = false,
      destructive = false,
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const isClickable = !!onClick && !disabled;
    // Use <div> when there's interactive trailing content (e.g. Switch) to avoid button-in-button
    const useDiv = !!trailing && !onClick;

    // Detect if icon is a component type (LucideIcon) vs a rendered ReactNode
    const isLucideIcon = icon
      ? typeof icon === "function" ||
        (typeof icon === "object" &&
          icon !== null &&
          ("render" in (icon as any) || "$$typeof" in (icon as any)) &&
          !React.isValidElement(icon))
      : false;

    const content = (
      <>
        {/* Icon */}
        {icon && (
          isLucideIcon ? (
            <IconCircle
              icon={icon as LucideIcon}
              size={iconSize}
              color={destructive ? "destructive" : (iconColor ?? "accent")}
            />
          ) : (
            icon as React.ReactNode
          )
        )}

        {/* Text area */}
        <div className="flex-1 min-w-0 text-left">
          <p
            className={cn(
              "text-sm font-medium truncate",
              destructive ? "text-destructive" : "text-foreground"
            )}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side */}
        {value && (
          <span
            className={cn(
              "text-xs text-muted-foreground shrink-0",
              valueClassName
            )}
          >
            {value}
          </span>
        )}
        {trailing}
        {showChevron && (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        )}
      </>
    );

    const sharedClassName = cn(
      "w-full flex items-center gap-3 p-3 transition-colors",
      isClickable && "hover:bg-muted/50 active:bg-muted/50 cursor-pointer",
      showDivider && "border-b border-border",
      disabled && "opacity-50 pointer-events-none",
      className
    );

    if (useDiv) {
      return (
        <motion.div
          ref={ref as any}
          whileTap={undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={sharedClassName}
          {...(props as any)}
        >
          {content}
        </motion.div>
      );
    }

    return (
      <motion.button
        ref={ref as any}
        type="button"
        disabled={disabled}
        onClick={onClick}
        whileTap={isClickable ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={sharedClassName}
        {...(props as any)}
      >
        {content}
      </motion.button>
    );
  }
);
ListItem.displayName = "ListItem";

export { ListItem };
