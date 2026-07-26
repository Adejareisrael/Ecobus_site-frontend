"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/booking-store";
import { useAuthStore } from "@/store/auth-store";
import { BookingSummary } from "@/components/BookingSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AppliedPromo, Booking } from "@/lib/types";
import { uppercaseCodeInput } from "@/lib/form-input";
import { formatNaira, getBookingTotal, getDiscountedTotal } from "@/lib/utils";

export default function ReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const trip = useBookingStore((s) => s.selectedTrip);
  const travelDate = useBookingStore((s) => s.selectedTravelDate);
  const seats = useBookingStore((s) => s.selectedSeats);
  const passenger = useBookingStore((s) => s.passenger);
  const appliedPromo = useBookingStore((s) => s.appliedPromo);
  const setAppliedPromo = useBookingStore((s) => s.setAppliedPromo);
  const setLastBooking = useBookingStore((s) => s.setLastBooking);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!trip || seats.length === 0) router.replace("/search");
  }, [trip, seats, router]);

  if (!trip || seats.length === 0) return null;

  const total = getBookingTotal(trip.price, seats.length);
  const finalTotal = getDiscountedTotal(total, appliedPromo?.discountAmount);
  const email = passenger.email || user?.email || "";

  const applyPromoCode = async () => {
    setPromoLoading(true);
    setPromoMessage("");

    const res = await fetch("/api/promo-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, total }),
    });
    const data = await res.json();

    if (!res.ok) {
      setAppliedPromo(null);
      setPromoMessage((data as { error?: string }).error ?? "Promo code could not be applied.");
      setPromoLoading(false);
      return;
    }

    setAppliedPromo(data as AppliedPromo);
    setPromoCode((data as AppliedPromo).code);
    setPromoMessage("Promo code applied.");
    setPromoLoading(false);
  };

  const confirmReservation = async () => {
    setLoading(true);
    setErrorMessage("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        trip,
        travelDate,
        seats,
        passenger,
        promoCode: appliedPromo?.code,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMessage((data as { error?: string }).error ?? "Could not confirm reservation.");
      setLoading(false);
      return;
    }

    setLastBooking(data as Booking);
    router.push(`/confirmation/${(data as Booking).id}`);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:py-10 lg:grid-cols-[1.5fr_0.9fr]">

      {/* LEFT */}
      <Card className="p-5 sm:p-6 space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold">Review reservation</h1>
          <p className="text-sm text-slate-500">
            Confirm your details, then pay in cash at the terminal.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium">Promo code</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={promoCode}
              onChange={(event) => {
                setPromoCode(uppercaseCodeInput(event.target.value));
                setPromoMessage("");
              }}
              placeholder="ECO10"
              className="uppercase"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={applyPromoCode}
              disabled={promoLoading || !promoCode.trim()}
              className="sm:w-32"
            >
              {promoLoading ? "Checking..." : "Apply"}
            </Button>
          </div>
          {promoMessage && (
            <p
              className={`mt-2 text-sm ${
                appliedPromo ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {promoMessage}
            </p>
          )}
          {appliedPromo && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {appliedPromo.code} saved {formatNaira(appliedPromo.discountAmount)}.
            </div>
          )}
        </div>

        {/* RESERVATION INFO */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50">
          <p className="text-sm text-slate-500">Reserving as</p>
          <p className="font-medium">{email || "—"}</p>
          <p className="text-xs text-slate-400">
            Travel date: {travelDate || "Today"}. No payment is taken online — you&apos;ll pay
            the amount due in cash when you check in at the terminal.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <Button
          className="w-full bg-ecobus-red text-white"
          onClick={confirmReservation}
          disabled={loading}
        >
          {loading ? "Confirming..." : `Confirm reservation — ₦${finalTotal.toLocaleString()} due`}
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
