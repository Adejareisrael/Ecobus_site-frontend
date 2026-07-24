"use client";

import { useState } from "react";
import { Select } from "./Select";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
};

type DateParts = {
  year?: number;
  month?: number;
  day?: number;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseValue(value: string): DateParts {
  const parts = value.split("-");
  return {
    year: parts[0] ? Number(parts[0]) : undefined,
    month: parts[1] ? Number(parts[1]) : undefined,
    day: parts[2] ? Number(parts[2]) : undefined,
  };
}

function composeValue(parts: DateParts) {
  return parts.year && parts.month && parts.day
    ? `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
    : "";
}

export function DateDropdown({
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className,
  name,
}: Props) {
  const [local, setLocal] = useState<DateParts>(() => parseValue(value));
  const [syncedValue, setSyncedValue] = useState(value);

  // Only resync from the value prop when it reflects a genuinely external
  // change (a different date loaded, or an external reset) — not our own
  // echo of an in-progress, still-incomplete selection. Adjusting state
  // during render (rather than in an effect) avoids an extra render pass.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== composeValue(local)) {
      setLocal(parseValue(value));
    }
  }

  const { year, month, day } = local;

  const update = (next: DateParts) => {
    setLocal(next);
    onChange(composeValue(next));
  };

  const today = new Date();
  const minYear = min ? Number(min.slice(0, 4)) : today.getFullYear();
  const maxYear = max ? Number(max.slice(0, 4)) : today.getFullYear() + 5;

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);

  let months: number[];
  if (!year) {
    months = MONTHS.map((_, i) => i + 1);
  } else {
    months = [];
    for (let m = 1; m <= 12; m += 1) {
      const monthStart = `${year}-${pad(m)}-01`;
      const monthEnd = `${year}-${pad(m)}-${pad(daysInMonth(year, m))}`;
      if (max && monthStart > max) continue;
      if (min && monthEnd < min) continue;
      months.push(m);
    }
  }

  let days: number[];
  if (!year || !month) {
    days = Array.from({ length: 31 }, (_, i) => i + 1);
  } else {
    const total = daysInMonth(year, month);
    days = [];
    for (let d = 1; d <= total; d += 1) {
      const candidate = `${year}-${pad(month)}-${pad(d)}`;
      if (min && candidate < min) continue;
      if (max && candidate > max) continue;
      days.push(d);
    }
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <Select
        className="px-2"
        aria-label="Day"
        value={day ?? ""}
        disabled={disabled}
        required={required}
        onChange={(e) => {
          const nextDay = e.target.value ? Number(e.target.value) : undefined;
          update({ year, month, day: nextDay });
        }}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </Select>

      <Select
        className="px-2"
        aria-label="Month"
        value={month ?? ""}
        disabled={disabled}
        required={required}
        onChange={(e) => {
          const nextMonth = e.target.value ? Number(e.target.value) : undefined;
          const nextDay =
            day && nextMonth && year && day > daysInMonth(year, nextMonth)
              ? undefined
              : day;
          update({ year, month: nextMonth, day: nextDay });
        }}
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {MONTHS[m - 1]}
          </option>
        ))}
      </Select>

      <Select
        className="px-2"
        aria-label="Year"
        value={year ?? ""}
        disabled={disabled}
        required={required}
        onChange={(e) => {
          const nextYear = e.target.value ? Number(e.target.value) : undefined;
          const nextDay =
            day && month && nextYear && day > daysInMonth(nextYear, month)
              ? undefined
              : day;
          update({ year: nextYear, month, day: nextDay });
        }}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>

      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
