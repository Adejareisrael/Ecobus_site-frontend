"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/booking-store";
import { useAuthStore } from "@/store/auth-store";
import { BookingSummary } from "@/components/BookingSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AppliedPromo } from "@/lib/types";
import { uppercaseCodeInput } from "@/lib/form-input";
import { formatNaira, getBookingTotal, getDiscountedTotal } from "@/lib/utils";

const PAYSTACK_PAGE_URL = process.env.NEXT_PUBLIC_PAYSTACK_PAGE_URL ?? "";
const showDemoCheckout = process.env.NODE_ENV !== "production";

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const trip = useBookingStore((s) => s.selectedTrip);
  const travelDate = useBookingStore((s) => s.selectedTravelDate);
  const seats = useBookingStore((s) => s.selectedSeats);
  const passenger = useBookingStore((s) => s.passenger);
  const appliedPromo = useBookingStore((s) => s.appliedPromo);
  const setAppliedPromo = useBookingStore((s) => s.setAppliedPromo);
  const user = useAuthStore((s) => s.user);

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

  const handlePay = () => {
    if (!PAYSTACK_PAGE_URL) return;
    setLoading(true);

    const reference = `ecobus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const params = new URLSearchParams({
      amount: String(finalTotal * 100), // kobo
      email,
      reference,
    });

    // Redirect to Paystack hosted page — Paystack sends user back to
    // the callback URL configured in the Paystack dashboard after payment
    window.location.href = `${PAYSTACK_PAGE_URL}?${params.toString()}`;
  };

  const handleDemoBooking = () => {
    const reference = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    router.push(`/payment/callback?reference=${reference}`);
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

        {/* PAYMENT INFO */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50">
          <p className="text-sm text-slate-500">Paying as</p>
          <p className="font-medium">{email || "—"}</p>
          <p className="text-xs text-slate-400">
            Travel date: {travelDate || "Today"}. You will be redirected to Paystack to complete your payment securely.
          </p>
        </div>

        {!PAYSTACK_PAGE_URL && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Payment is not configured yet. Add the Paystack payment URL before launch.
          </div>
        )}

        <Button
          className="w-full bg-ecobus-red text-white"
          onClick={handlePay}
          disabled={loading || !PAYSTACK_PAGE_URL}
        >
          {loading ? "Redirecting to Paystack..." : `Pay ₦${finalTotal.toLocaleString()}`}
        </Button>

        {showDemoCheckout && (
          <Button
            className="w-full"
            variant="ghost"
            onClick={handleDemoBooking}
            disabled={loading}
          >
            Complete demo booking
          </Button>
        )}

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
