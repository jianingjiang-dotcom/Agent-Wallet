import * as React from "react";
import { CheckCircle2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  title: string;
  icon: LucideIcon;
}

export interface StepIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Step definitions */
  steps: StepItem[];
  /** Current active step (1-indexed) */
  currentStep: number;
  /** Steps that should be marked as completed regardless of currentStep */
  completedSteps?: number[];
  /** Show step title labels below indicators */
  showLabels?: boolean;
}

const StepIndicator = React.forwardRef<HTMLDivElement, StepIndicatorProps>(
  (
    {
      className,
      steps,
      currentStep,
      completedSteps = [],
      showLabels = false,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("", className)} {...props}>
        <div className="flex items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete =
              currentStep > step.id || completedSteps.includes(step.id);
            const isCurrent =
              currentStep === step.id && !completedSteps.includes(step.id);

            return (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none"
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
                    isComplete && "bg-success text-success-foreground",
                    isCurrent && "bg-accent text-accent-foreground",
                    !isComplete &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2
                      className="w-5 h-5"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      currentStep > step.id ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Optional labels */}
        {showLabels && (
          <div className="flex items-center mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex-1 text-center",
                  index === steps.length - 1 && "flex-none w-10"
                )}
              >
                <span
                  className={cn(
                    "text-[10px]",
                    currentStep >= step.id
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
StepIndicator.displayName = "StepIndicator";

export { StepIndicator };
