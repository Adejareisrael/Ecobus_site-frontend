"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/api";
import { useBookingStore } from "@/store/booking-store";
import { BookingSummary } from "@/components/BookingSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const trip = useBookingStore((state) => state.selectedTrip);
  const seats = useBookingStore((state) => state.selectedSeats);
  const passenger = useBookingStore((state) => state.passenger);
  const paymentMethod = useBookingStore((state) => state.paymentMethod);
  const setPaymentMethod = useBookingStore((state) => state.setPaymentMethod);
  const setLastBooking = useBookingStore((state) => state.setLastBooking);

  useEffect(() => {
    if (!trip || seats.length === 0) {
      router.replace("/seats");
    }
  }, [trip, seats, router]);

  if (!trip || seats.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-500">
        Redirecting you back to seats...
      </div>
    );
  }

  const handlePay = async () => {
    if (loading) return;

    setLoading(true);

    const booking = await createBooking({
      trip,
      seats,
      passenger,
      paymentMethod,
    });

    setLastBooking(booking);

    setLoading(false);
    router.push(`/confirmation/${booking.id}`);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:py-10 lg:grid-cols-[1.5fr_0.9fr]">

      {/* LEFT */}
      <Card className="p-5 sm:p-6 space-y-6">

        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold">
            Payment
          </h1>

          <p className="text-sm text-slate-600">
            Mock payment UI only — no live gateway connected yet.
          </p>
        </div>

        {/* PAYMENT OPTIONS */}
        <div className="grid gap-4 sm:grid-cols-2">

          <button
            className={`rounded-2xl border p-4 sm:p-5 text-left transition ${
              paymentMethod === "Card"
                ? "border-ecobus-red bg-ecobus-light"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => setPaymentMethod("Card")}
          >
            <div className="font-semibold">Card</div>
            <div className="text-sm text-slate-500">
              Visa, Mastercard, Verve
            </div>
          </button>

          <button
            className={`rounded-2xl border p-4 sm:p-5 text-left transition ${
              paymentMethod === "Transfer"
                ? "border-ecobus-red bg-ecobus-light"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => setPaymentMethod("Transfer")}
          >
            <div className="font-semibold">Transfer</div>
            <div className="text-sm text-slate-500">
              Pay via bank transfer
            </div>
          </button>

        </div>

        {/* CTA */}
        <div className="pt-2">
          <Button
            className="w-full lg:w-auto"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Processing payment..." : "Pay now"}
          </Button>
        </div>

      </Card>

      {/* RIGHT - DESKTOP SUMMARY */}
      <div className="hidden lg:block lg:sticky lg:top-6">
        <BookingSummary />
      </div>

      {/* MOBILE SUMMARY */}
      <div className="lg:hidden">
        <Card className="p-4">
          <BookingSummary />
        </Card>
      </div>

    </div>
  );
}