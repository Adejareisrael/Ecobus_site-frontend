"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Search } from "lucide-react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Terminal } from "@/lib/types";

type Props = {
  terminals: Terminal[];
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
};

export function SearchForm({
  terminals,
  initialFrom = "",
  initialTo = "",
  initialDate = "",
}: Props) {
  const router = useRouter();

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState(initialDate);

  const destinations = useMemo(() => {
    return terminals.filter((t) => t.id !== from);
  }, [from, terminals]);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleSearch = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const nextFrom = String(formData.get("from") || "");
    const nextTo = String(formData.get("to") || "");
    const nextDate = String(formData.get("date") || "");
    const params = new URLSearchParams();

    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    if (nextDate) params.set("date", nextDate);

    router.push(`/search?${params.toString()}`);
  };

  const swapTerminals = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSearch(event.currentTarget);
      }}
      className="
        grid w-full min-w-0 gap-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100
        grid-cols-1
        md:grid-cols-[1.2fr_auto_1.2fr_1fr_auto]
      "
    >
      <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-500">
        From
        <Select name="from" value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">Select terminal</option>
          {terminals.map((terminal) => (
            <option key={terminal.id} value={terminal.id}>
              {terminal.city} - {terminal.name}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex items-end justify-start md:justify-center">
        <button
          type="button"
          onClick={swapTerminals}
          disabled={!from && !to}
          aria-label="Swap route"
          title="Swap route"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-ecobus-red hover:text-ecobus-red disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>

      <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-500">
        To
        <Select name="to" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Select terminal</option>
          {destinations.map((terminal) => (
            <option key={terminal.id} value={terminal.id}>
              {terminal.city} - {terminal.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-500">
        Date
        <Input
          type="date"
          name="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <Button className="h-12 w-full self-end gap-2" type="submit">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
