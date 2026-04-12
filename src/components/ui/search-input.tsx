import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Controlled value */
  value: string;
  /** Value change handler (receives clean string, not event) */
  onChange: (value: string) => void;
  /** Visual variant */
  variant?: "default" | "ghost";
  /** Additional class on the wrapper */
  wrapperClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      wrapperClassName,
      value,
      onChange,
      placeholder = "搜索...",
      variant = "default",
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" strokeWidth={1.5} style={{ color: '#B9BCC5' }} />
        <Input
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pl-9",
            value && "pr-9",
            variant === "ghost" && "bg-muted/50 border-0",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
