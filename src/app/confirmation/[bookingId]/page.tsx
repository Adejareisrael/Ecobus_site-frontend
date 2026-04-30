"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Booking } from "@/lib/types";
import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal } from "@/lib/utils";

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();

  const resetFlow = useBookingStore((state) => state.resetFlow);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        setLoading(true);

        const res = await fetch(`/api/bookings/${params.bookingId}`);

        if (!res.ok) throw new Error("Booking not found");

        const data = await res.json();
        setBooking(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [params.bookingId]);

  const total = useMemo(() => {
    if (!booking) return 0;
    return getBookingTotal(booking.trip.price, booking.seats.length);
  }, [booking]);

  const downloadTicket = () => {
    if (!booking) return;

    const blob = new Blob(
      [
        `Ecobus Ticket
Reference: ${booking.reference}
Route: ${booking.trip.routeLabel}
Seats: ${booking.seats.join(", ")}
Passenger: ${booking.passenger.fullName}
Total: ${formatNaira(total)}
`,
      ],
      { type: "text/plain" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ecobus-${booking.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6 text-slate-500">
          Loading your ticket...
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6 text-red-500">
          Booking not found or expired.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:py-10 space-y-6">

      {/* SUCCESS BANNER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-sm text-emerald-600">
          ✔ Booking Confirmed
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-ecobus-purple">
          Your Ecobus ticket is ready
        </h1>

        <p className="text-sm text-slate-600">
          Present this ticket at the terminal before departure
        </p>
      </div>

      {/* TICKET CARD */}
      <Card className="p-0 overflow-hidden">

        {/* HEADER STRIP */}
        <div className="bg-ecobus-red text-white p-5 text-center">
          <p className="text-xs uppercase tracking-widest opacity-80">
            Ecobus Digital Ticket
          </p>

          <p className="font-bold text-lg tracking-widest">
            {booking.reference}
          </p>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-5">

          {/* ROUTE */}
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold">
              {booking.trip.routeLabel}
            </p>

            <p className="text-sm text-slate-500">
              Departure: {booking.trip.departureTime}
            </p>
          </div>

          {/* DETAILS GRID */}
          <div className="grid gap-3 text-sm bg-slate-50 p-4 rounded-xl">

            <div className="flex justify-between">
              <span>Passenger</span>
              <strong>{booking.passenger.fullName}</strong>
            </div>

            <div className="flex justify-between">
              <span>Seats</span>
              <strong>{booking.seats.join(", ")}</strong>
            </div>

            <div className="flex justify-between">
              <span>Total Paid</span>
              <strong className="text-ecobus-red">
                {formatNaira(total)}
              </strong>
            </div>

          </div>

          {/* QR (still placeholder but better structured) */}
          <div className="flex justify-center">
            <div className="h-28 w-28 rounded-xl border bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              QR CODE
            </div>
          </div>

        </div>
      </Card>

      {/* ACTIONS */}
      <div className="grid gap-3 sm:grid-cols-3">

        <Button onClick={downloadTicket} className="w-full">
          Download
        </Button>

        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            resetFlow();
            router.push("/");
          }}
        >
          Home
        </Button>

      </div>

    </div>
  );
}