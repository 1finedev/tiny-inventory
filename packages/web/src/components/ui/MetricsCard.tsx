import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";

export interface MetricsCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  icon?: React.ReactNode;
}

export const MetricsCard = forwardRef<HTMLDivElement, MetricsCardProps>(
  ({ className, label, value, variant = "default", icon, ...props }, ref) => {
    const variantStyles = {
      default: "bg-r-7 border-d-10",
      primary: "bg-primary-highlight border-primary/30",
      success: "bg-green/10 border-green/30",
      warning: "bg-yellow/10 border-yellow/30",
      destructive: "bg-destructive/10 border-destructive/30",
    };

    const valueColors = {
      default: "text-foreground",
      primary: "text-primary",
      success: "text-green",
      warning: "text-yellow",
      destructive: "text-destructive",
    };

    return (
      <Card
        ref={ref}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {label}
              </p>
              <p className={cn("text-3xl font-bold", valueColors[variant])}>
                {typeof value === "number" && value.toLocaleString
                  ? value.toLocaleString()
                  : value}
              </p>
            </div>
            {icon && (
              <div className="ml-4 text-muted-foreground opacity-60">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

MetricsCard.displayName = "MetricsCard";
