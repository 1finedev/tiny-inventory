import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: "success" | "warning" | "error" | "info" | "pending";
  showDot?: boolean;
}

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, showDot = true, children, ...props }, ref) => {
    const statusStyles = {
      success: "bg-green/20 text-green border-green/30",
      warning: "bg-yellow/20 text-yellow border-yellow/30",
      error: "bg-destructive/20 text-destructive border-destructive/30",
      info: "bg-blue/20 text-blue border-blue/30",
      pending: "bg-muted text-muted-foreground border-border",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
          statusStyles[status],
          className
        )}
        {...props}
      >
        {showDot && (
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "success" && "bg-green",
            status === "warning" && "bg-yellow",
            status === "error" && "bg-destructive",
            status === "info" && "bg-blue",
            status === "pending" && "bg-muted-foreground"
          )} />
        )}
        {children}
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";
