import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          ref={ref}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background/50 backdrop-blur-sm",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all",
            className
          )}
          onChange={(e) => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
