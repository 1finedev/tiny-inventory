import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "outline";
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";

    const variants = {
      default: "bg-d-10 text-foreground",
      primary: "bg-primary-highlight text-primary",
      success: "bg-green/20 text-green",
      warning: "bg-yellow/20 text-yellow",
      destructive: "bg-destructive/20 text-destructive",
      outline: "border border-border text-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";
