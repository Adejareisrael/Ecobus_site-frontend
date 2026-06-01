"use client";

import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/booking-store";
import { BookingSummary } from "@/components/BookingSummary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useEffect } from "react";

export default function PassengerPage() {
  const router = useRouter();

  const passenger = useBookingStore((state) => state.passenger);
  const setPassenger = useBookingStore((state) => state.setPassenger);

  const trip = useBookingStore((state) => state.selectedTrip);
  const selectedSeats = useBookingStore((state) => state.selectedSeats);

  useEffect(() => {
    if (!trip || selectedSeats.length === 0) {
      router.replace("/search");
    }
  }, [trip, selectedSeats, router]);

  if (!trip || selectedSeats.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:py-10 lg:grid-cols-[1.5fr_0.9fr]">

      {/* LEFT */}
      <Card className="p-5 sm:p-6 space-y-6">

        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold">
            Passenger details
          </h1>

          <p className="text-sm text-slate-600">
            Enter the traveler’s information.
          </p>
        </div>

        {/* FORM */}
        <div className="grid gap-4">

          <Input
            className="h-12"
            placeholder="Full name"
            value={passenger.fullName}
            onChange={(e) =>
              setPassenger({ fullName: e.target.value })
            }
          />

          <Input
            className="h-12"
            placeholder="Phone number"
            value={passenger.phone}
            onChange={(e) =>
              setPassenger({ phone: e.target.value })
            }
          />

          <Input
            className="h-12"
            placeholder="Email address"
            type="email"
            value={passenger.email}
            onChange={(e) =>
              setPassenger({ email: e.target.value })
            }
          />

        </div>

        {/* CTA */}
        <div className="pt-2">
          <Button
            className="w-full lg:w-auto"
            onClick={() => router.push("/payment")}
            disabled={
              !passenger.fullName.trim() ||
              !passenger.phone.trim() ||
              !passenger.email.trim()
            }
          >
            Proceed to payment
          </Button>
        </div>

      </Card>

      {/* DESKTOP SUMMARY */}
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
