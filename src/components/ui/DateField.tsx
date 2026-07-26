import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

// Android's WebView doesn't draw the day/month/year placeholder segments
// desktop browsers show for an empty date input, and native rendering of
// the entered value is inconsistent enough across engines that we render
// our own overlay as the single source of truth (see the matching
// input[type="date"] rules in globals.css, which hide the native text
// except while the field is actively focused).
export function DateField({ value, className, ...props }: Props) {
  const stringValue = typeof value === "string" ? value : "";

  return (
    <div className="relative">
      <Input type="date" value={value} className={className} {...props} />
      <span
        className={cn(
          "date-field-overlay pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm",
          stringValue ? "text-ecobus-dark dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
        )}
      >
        {stringValue ? formatDisplayDate(stringValue) : "dd/mm/yyyy"}
      </span>
    </div>
  );
}
