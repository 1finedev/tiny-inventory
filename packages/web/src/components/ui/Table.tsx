import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Table = forwardRef<
  HTMLTableElement,
  HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b border-table-border bg-table-shade", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-table-border transition-colors hover:bg-d-7/50 data-[state=selected]:bg-d-10",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-sm text-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 align-middle text-sm [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";
