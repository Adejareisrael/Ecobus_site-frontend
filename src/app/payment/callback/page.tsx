"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "@/store/booking-store";
import { useAuthStore } from "@/store/auth-store";
import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trip = useBookingStore((s) => s.selectedTrip);
  const travelDate = useBookingStore((s) => s.selectedTravelDate);
  const seats = useBookingStore((s) => s.selectedSeats);
  const passenger = useBookingStore((s) => s.passenger);
  const appliedPromo = useBookingStore((s) => s.appliedPromo);
  const setLastBooking = useBookingStore((s) => s.setLastBooking);
  const token = useAuthStore((s) => s.token);

  const [error, setError] = useState("");

  useEffect(() => {
    async function verifyPayment() {
      await Promise.resolve();

      const reference = searchParams.get("reference") ?? searchParams.get("trxref");

      if (!reference) {
        setError("No payment reference received.");
        return;
      }

      if (!trip || seats.length === 0) {
        setError("Booking session expired. Please start over.");
        return;
      }

      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            reference,
            trip,
            travelDate,
            seats,
            passenger,
            promoCode: appliedPromo?.code ?? null,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error((data as { error?: string }).error ?? "Verification failed");
        }

        setLastBooking(data as Booking);
        router.replace(`/confirmation/${(data as Booking).id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Payment verification failed.");
      }
    }

    void verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 space-y-4">
        <Card className="p-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-red-600">
              We could not confirm this payment
            </h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="w-full" onClick={() => router.replace("/payment")}>
              Try again
            </Button>
            <Link href="/lookup">
              <Button className="w-full" variant="secondary">
                Find booking
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PaymentCallbackLoading />
  );
}

function PaymentCallbackLoading() {
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
