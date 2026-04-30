import React from "react";
import { cn } from "@/lib/utils";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <select
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition",
        "focus:border-ecobus-red focus:ring-2 focus:ring-ecobus-light",
        "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}