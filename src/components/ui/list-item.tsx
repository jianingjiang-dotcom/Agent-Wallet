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
              "text-[14px] leading-5 font-normal truncate",
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
        {trailing}
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              className={cn(
                "text-[14px] leading-5 text-muted-foreground",
                valueClassName
              )}
            >
              {value}
            </span>
          )}
          {showChevron && (
            <ChevronRight className="w-5 h-5 shrink-0" strokeWidth={1} style={{ color: '#000000' }} />
          )}
        </div>
      </>
    );

    const sharedClassName = cn(
      "w-full flex items-center gap-3 px-3 py-4 transition-colors",
      isClickable && "cursor-pointer",
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
        whileTap={undefined}
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
