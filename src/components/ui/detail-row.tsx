import * as React from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";

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
    const handleCopy = React.useCallback(async () => {
      if (!copyValue) return;
      const ok = await copyToClipboard(copyValue);
      if (ok) {
        toast.success('复制成功');
      }
    }, [copyValue]);

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between px-4", className)}
        {...props}
      >
        <span className="text-muted-foreground shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}>{label}</span>

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
              className="p-0 rounded transition-colors shrink-0"
              aria-label="Copy"
            >
              <img src="/copy.svg" alt="copy" className="w-4 h-4" />
            </button>
          )}

          {externalLink && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 rounded transition-colors shrink-0"
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
