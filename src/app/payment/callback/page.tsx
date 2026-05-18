"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "@/store/booking-store";
import { useAuthStore } from "@/store/auth-store";
import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trip = useBookingStore((s) => s.selectedTrip);
  const seats = useBookingStore((s) => s.selectedSeats);
  const passenger = useBookingStore((s) => s.passenger);
  const setLastBooking = useBookingStore((s) => s.setLastBooking);
  const token = useAuthStore((s) => s.token);

  const [error, setError] = useState("");

  useEffect(() => {
    // Paystack sends back ?reference=xxx or ?trxref=xxx
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");

    if (!reference) {
      setError("No payment reference received.");
      return;
    }

    if (!trip || seats.length === 0) {
      setError("Booking session expired. Please start over.");
      return;
    }

    fetch("/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reference, trip, seats, passenger }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error((data as { error?: string }).error ?? "Verification failed");
        setLastBooking(data as Booking);
        router.replace(`/confirmation/${(data as Booking).id}`);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Payment verification failed.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 space-y-4">
        <Card className="p-6 space-y-4">
          <p className="text-red-500 font-medium">{error}</p>
          <Button className="w-full" onClick={() => router.replace("/")}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="p-6 text-center space-y-3">
        <div className="text-slate-500 text-sm animate-pulse">
          Verifying your payment...
        </div>
      </Card>
    </div>
  );
}
