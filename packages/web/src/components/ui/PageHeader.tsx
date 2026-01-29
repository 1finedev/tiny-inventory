import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)} {...props}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-inter">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
