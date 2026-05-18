"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Terminal } from "@/lib/types";

type Props = {
  terminals: Terminal[];
};

export function SearchForm({ terminals }: Props) {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const destinations = useMemo(() => {
    return terminals.filter((t) => t.id !== from);
  }, [from, terminals]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div
      className="
        grid gap-4 rounded-3xl bg-white p-5 shadow-lg
        grid-cols-1
        md:grid-cols-[1.2fr_1.2fr_1fr_auto]
      "
    >
      {/* FROM */}
      <Select value={from} onChange={(e) => setFrom(e.target.value)}>
        <option value="">From terminal</option>
        {terminals.map((terminal) => (
          <option key={terminal.id} value={terminal.id}>
            {terminal.name}
          </option>
        ))}
      </Select>

      {/* TO */}
      <Select value={to} onChange={(e) => setTo(e.target.value)}>
        <option value="">To terminal</option>
        {destinations.map((terminal) => (
          <option key={terminal.id} value={terminal.id}>
            {terminal.name}
          </option>
        ))}
      </Select>

      {/* DATE */}
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* BUTTON */}
      <Button className="h-full w-full" onClick={handleSearch}>
        Search trips
      </Button>
    </div>
  );
}