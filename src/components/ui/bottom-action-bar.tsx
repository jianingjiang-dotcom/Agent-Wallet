import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const bottomActionBarVariants = cva("p-4 pb-8 shrink-0", {
  variants: {
    variant: {
      /** Fixed to the bottom of the viewport */
      fixed: "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg z-40",
      /** Sticky at the bottom of scroll container */
      sticky: "sticky bottom-0 bg-background/80 backdrop-blur-lg z-40",
      /** Inline flow (no positioning) */
      inline: "",
    },
    withBorder: {
      true: "border-t border-border",
      false: "",
    },
  },
  defaultVariants: {
    variant: "inline",
    withBorder: false,
  },
});

export interface BottomActionBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bottomActionBarVariants> {}

const BottomActionBar = React.forwardRef<HTMLDivElement, BottomActionBarProps>(
  ({ className, variant, withBorder, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          bottomActionBarVariants({ variant, withBorder }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BottomActionBar.displayName = "BottomActionBar";

export { BottomActionBar, bottomActionBarVariants };
