"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/booking-store";
import { useAuthStore } from "@/store/auth-store";
import { BookingSummary } from "@/components/BookingSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getBookingTotal } from "@/lib/utils";

const PAYSTACK_PAGE_URL = "https://paystack.shop/pay/ecobus-booking";

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const trip = useBookingStore((s) => s.selectedTrip);
  const seats = useBookingStore((s) => s.selectedSeats);
  const passenger = useBookingStore((s) => s.passenger);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!trip || seats.length === 0) router.replace("/seats");
  }, [trip, seats, router]);

  if (!trip || seats.length === 0) return null;

  const total = getBookingTotal(trip.price, seats.length);
  const email = passenger.email || user?.email || "";

  const handlePay = () => {
    setLoading(true);

    const reference = `ecobus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const params = new URLSearchParams({
      amount: String(total * 100), // kobo
      email,
      reference,
    });

    // Redirect to Paystack hosted page — Paystack sends user back to
    // the callback URL configured in the Paystack dashboard after payment
    window.location.href = `${PAYSTACK_PAGE_URL}?${params.toString()}`;
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:py-10 lg:grid-cols-[1.5fr_0.9fr]">

      {/* LEFT */}
      <Card className="p-5 sm:p-6 space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold">Payment</h1>
          <p className="text-sm text-slate-500">
            Secure payment powered by Paystack
          </p>
        </div>

        {/* PAYMENT INFO */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50">
          <p className="text-sm text-slate-500">Paying as</p>
          <p className="font-medium">{email || "—"}</p>
          <p className="text-xs text-slate-400">
            You will be redirected to Paystack to complete your payment securely.
          </p>
        </div>

        <Button
          className="w-full bg-ecobus-red text-white"
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? "Redirecting to Paystack..." : `Pay ₦${total.toLocaleString()}`}
        </Button>

      </Card>

      {/* RIGHT - SUMMARY */}
      <div className="hidden lg:block lg:sticky lg:top-6">
        <BookingSummary />
      </div>

      <div className="lg:hidden">
        <Card className="p-4">
          <BookingSummary />
        </Card>
      </div>

    </div>
  );
}
