import { cn } from "@/lib/utils";
import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-sky-900/50 dark:bg-[#0e1a2d]",
        "transition",
        className
      )}
      {...props}
    />
  );
}
