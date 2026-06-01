import React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const blockedNumberKeys = new Set(["e", "E", "+", "-", ".", ","]);

export function Input({ className, disabled, onKeyDown, type, inputMode, ...props }: Props) {
  return (
    <input
      type={type}
      inputMode={inputMode ?? (type === "number" ? "numeric" : undefined)}
      disabled={disabled}
      onKeyDown={(event) => {
        if (type === "number" && blockedNumberKeys.has(event.key)) {
          event.preventDefault();
        }

        onKeyDown?.(event);
      }}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm",
        "outline-none transition placeholder:text-slate-400",
        "focus:border-ecobus-red focus:ring-2 focus:ring-ecobus-light",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
        "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}
