import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <div className="relative w-full min-w-0">
      <select
        disabled={disabled}
        className={cn(
          "w-full min-w-0 truncate rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition appearance-none",
          "focus:border-ecobus-red focus:ring-2 focus:ring-ecobus-light",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
