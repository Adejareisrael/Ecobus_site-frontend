"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { getSeats, getTripById } from "@/lib/api";
import { Trip, Seat } from "@/lib/types";

import { useBookingStore } from "@/store/booking-store";
import { SeatSelector } from "@/components/SeatSelector";
import { BookingSummary } from "@/components/BookingSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { normalizeTravelDate } from "@/lib/travel-date";

export default function SeatPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const searchParams = useSearchParams();

  const setTripInStore = useBookingStore((state) => state.setTrip);
  const setTravelDate = useBookingStore((state) => state.setTravelDate);
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const travelDate = normalizeTravelDate(searchParams.get("date"));

  const [trip, setTripData] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.tripId) return;

    async function load() {
      setLoading(true);

      const [foundTrip, foundSeats] = await Promise.all([
        getTripById(params.tripId),
        getSeats(params.tripId, travelDate),
      ]);

      if (foundTrip) {
        setTripData(foundTrip);
        setTripInStore(foundTrip);
        setTravelDate(travelDate);
      }

      setSeats(foundSeats);
      setLoading(false);
    }

    load();
  }, [params?.tripId, setTripInStore, setTravelDate, travelDate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        Loading seats...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        Trip not found.
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:py-10 lg:grid-cols-[1.5fr_0.9fr]">

      {/* LEFT */}
      <Card className="p-6">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Select your seats
        </h1>

        <p className="mt-2 text-sm lg:text-base text-slate-600">
          {trip.routeLabel} · {travelDate} · {trip.departureTime} departure
        </p>

        <div className="mt-6">
          <SeatSelector seats={seats} />
        </div>

        {/* MOBILE SUMMARY */}
        <div className="lg:hidden mt-6">
          <Card className="p-4">
            <BookingSummary />
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-6 lg:mt-10">
          <Button
            className="w-full lg:w-auto"
            onClick={() => router.push("/passenger")}
            disabled={selectedSeats.length === 0}
          >
            Continue
          </Button>
        </div>

      </Card>

      {/* RIGHT (DESKTOP) */}
      <div className="hidden lg:block lg:sticky lg:top-6">
        <BookingSummary />
      </div>

    </div>
  );
}
