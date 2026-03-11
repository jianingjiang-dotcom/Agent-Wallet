import * as React from "react";
import { Copy, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn, copyToClipboard } from "@/lib/utils";

export interface DetailRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left-side label text */
  label: string;
  /** Right-side value */
  value: string | React.ReactNode;
  /** Sub-value displayed below the main value */
  subValue?: string;
  /** Optional icon/element before the value */
  icon?: React.ReactNode;
  /** If set, shows a copy button and copies this value */
  copyValue?: string;
  /** If set, shows an external link button */
  externalLink?: string;
  /** Use monospace font for value (addresses, hashes) */
  mono?: boolean;
  /** Max width for value text truncation */
  maxValueWidth?: string;
}

const DetailRow = React.forwardRef<HTMLDivElement, DetailRowProps>(
  (
    {
      className,
      label,
      value,
      subValue,
      icon,
      copyValue,
      externalLink,
      mono = false,
      maxValueWidth = "180px",
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(async () => {
      if (!copyValue) return;
      const ok = await copyToClipboard(copyValue);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    }, [copyValue]);

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between p-3", className)}
        {...props}
      >
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>

        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          {icon}

          <div className="text-right min-w-0">
            {typeof value === "string" ? (
              <span
                className={cn(
                  "text-sm text-foreground font-medium truncate block",
                  mono && "font-mono"
                )}
                style={{ maxWidth: maxValueWidth }}
              >
                {value}
              </span>
            ) : (
              value
            )}
            {subValue && (
              <span className="text-xs text-muted-foreground block">
                {subValue}
              </span>
            )}
          </div>

          {copyValue && (
            <button
              onClick={handleCopy}
              className="p-0.5 hover:bg-muted rounded transition-colors shrink-0"
              aria-label="Copy"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-success text-[10px] font-medium px-0.5"
                  >
                    ✓
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {externalLink && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 hover:bg-muted rounded transition-colors shrink-0"
              aria-label="Open link"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    );
  }
);
DetailRow.displayName = "DetailRow";

export { DetailRow };
