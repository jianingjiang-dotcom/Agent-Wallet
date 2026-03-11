import { Toaster as Sonner, toast } from "sonner";
import { useEffect, useState } from "react";
import { getDrawerContainer } from "@/components/layout/PhoneFrame";
import { createPortal } from "react-dom";
import { Check, X, AlertTriangle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Custom success icon - solid green circle with white checkmark
const SuccessIcon = () => (
  <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center flex-shrink-0">
    <Check className="w-4 h-4 text-white" strokeWidth={1.5} />
  </div>
);

// Custom error icon - solid red circle with X
const ErrorIcon = () => (
  <div className="w-7 h-7 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
    <X className="w-4 h-4 text-white" strokeWidth={1.5} />
  </div>
);

// Custom warning icon - solid orange circle with triangle
const WarningIcon = () => (
  <div className="w-7 h-7 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
    <AlertTriangle className="w-4 h-4 text-white" strokeWidth={1.5} />
  </div>
);

// Custom info icon
const InfoIcon = () => (
  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
    <Info className="w-4 h-4 text-white" strokeWidth={1.5} />
  </div>
);

const Toaster = ({ ...props }: ToasterProps) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Wait for PhoneFrame to mount
    const checkContainer = () => {
      const phoneContainer = getDrawerContainer();
      if (phoneContainer) {
        setContainer(phoneContainer);
      }
    };
    
    checkContainer();
    // Retry in case PhoneFrame isn't mounted yet
    const timer = setTimeout(checkContainer, 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render until we have a container
  if (!container) return null;

  const toasterElement = (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      containerAriaLabel="通知"
      expand={true}
      gap={8}
      visibleToasts={4}
      richColors={false}
      closeButton={false}
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
        warning: <WarningIcon />,
        info: <InfoIcon />,
        close: <X className="w-4 h-4" />,
      }}
      /**
       * Sonner's default CSS sets the toaster to `position: fixed`.
       * We override to `absolute` so it positions INSIDE PhoneFrame.
       * Top position accounts for notch area (~28px) + safe spacing
       */
      style={{
        position: "absolute",
        top: 44,
        bottom: "auto",
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "calc(100% - 32px)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
      toastOptions={{
        unstyled: true,
        duration: 3000,
        classNames: {
          toast:
            "w-full flex flex-row items-center gap-3 p-4 rounded-2xl shadow-lg pointer-events-auto bg-card",
          title: "font-semibold text-[16px] text-foreground leading-tight",
          description: "text-[12px] text-muted-foreground mt-0.5",
          icon: "flex-shrink-0 order-1",
          content: "flex-1 min-w-0 order-2",
          closeButton: "!static !transform-none order-3 flex-shrink-0 !p-0 !bg-transparent !border-0 !shadow-none !w-auto !h-auto",
          actionButton: "bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium",
          cancelButton: "bg-muted text-muted-foreground rounded-lg px-3 py-1.5 text-sm font-medium",
        },
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
        },
      }}
      {...props}
    />
  );

  return createPortal(toasterElement, container);
};

export { Toaster, toast };
