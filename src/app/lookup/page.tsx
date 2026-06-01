"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type LookupResult = {
  id: string;
  reference: string;
  routeLabel: string;
  travelDate: string;
  departureTime: string;
  seats: string[];
  passengerName: string;
  status: string;
};

export default function BookingLookupPage() {
  return (
    <Suspense fallback={<LookupShell />}>
      <BookingLookupContent />
    </Suspense>
  );
}

function BookingLookupContent() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("reference") ?? "");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResult(null);

    const params = new URLSearchParams({ reference, contact });
    const res = await fetch(`/api/bookings/lookup?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      setMessage((data as { error?: string }).error ?? "Booking not found.");
      setLoading(false);
      return;
    }

    setResult(data as LookupResult);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Find your booking</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your booking reference and the email or phone used at checkout.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="ECO-123456"
            required
          />
          <Input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Email or phone"
            required
          />
          <Button type="submit" className="gap-2" disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

        {result && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="grid gap-2">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Reference</span>
                <strong>{result.reference}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Route</span>
                <strong>{result.routeLabel}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Date</span>
                <strong>{result.travelDate}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Seats</span>
                <strong>{result.seats.join(", ")}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <strong>{result.status}</strong>
              </div>
            </div>

            <Link href={`/confirmation/${result.id}`}>
              <Button className="mt-4 w-full">Open ticket</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function LookupShell() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      <Card className="p-6 text-slate-500">Loading booking lookup...</Card>
    </div>
  );
}
