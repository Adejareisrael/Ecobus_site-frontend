"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { uppercaseCodeInput } from "@/lib/form-input";
import { useAuthStore } from "@/store/auth-store";

type LookupResult = {
  id: string;
  reference: string;
  routeLabel: string;
  travelDate: string;
  departureTime: string;
  seats: string[];
  passengerName: string;
  status: string;
  createdAt: string;
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
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [reference, setReference] = useState(searchParams.get("reference") ?? "");
  const [contact, setContact] = useState("");
  const [results, setResults] = useState<LookupResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isLoggedIn = hydrated && Boolean(user && token);

  const searchBookings = useCallback(async () => {
    setLoading(true);
    setMessage("");
    setResults([]);

    const params = new URLSearchParams();
    if (reference.trim()) params.set("reference", reference.trim());
    if (contact.trim()) params.set("contact", contact.trim());

    const res = await fetch(`/api/bookings/lookup?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage((data as { error?: string }).error ?? "Booking not found.");
      setLoading(false);
      return;
    }

    const bookings = (data as { bookings?: LookupResult[] }).bookings ?? [];
    setResults(bookings);
    if (bookings.length === 0) {
      setMessage("No bookings found.");
    }
    setLoading(false);
  }, [contact, reference, token]);

  useEffect(() => {
    if (!isLoggedIn) return;
    queueMicrotask(() => {
      void searchBookings();
    });
  }, [isLoggedIn, searchBookings]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await searchBookings();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Find your booking</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLoggedIn
            ? "Your recent bookings appear here. Add part of a booking code to narrow the list."
            : "Enter the email or phone used at checkout. The booking code is optional."}
        </p>
      </div>

      <Card className="p-5">
        <form
          onSubmit={handleSubmit}
          className={`grid gap-4 ${
            isLoggedIn ? "md:grid-cols-[1fr_auto]" : "md:grid-cols-[1fr_1fr_auto]"
          }`}
        >
          <Input
            value={reference}
            onChange={(event) => setReference(uppercaseCodeInput(event.target.value))}
            placeholder="Booking code (optional)"
          />
          {!isLoggedIn && (
            <Input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Email or phone"
              required
            />
          )}
          <Button type="submit" className="gap-2" disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

        {results.length > 0 && (
          <div className="mt-6 grid gap-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
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
            ))}
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
