"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Trip, Seat } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { useBookingStore } from "@/store/booking-store";
import { getSeats } from "@/lib/api";
import { normalizeTravelDate } from "@/lib/travel-date";

type Props = {
  trip: Trip;
  travelDate?: string;
};

export function TripCard({ trip, travelDate }: Props) {
  const setTrip = useBookingStore((state) => state.setTrip);
  const setTravelDate = useBookingStore((state) => state.setTravelDate);
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);
  const date = normalizeTravelDate(travelDate);

  useEffect(() => {
    async function loadSeats() {
      const seats: Seat[] = await getSeats(trip.id, date);
      setAvailableSeats(seats.filter((s) => s.isAvailable).length);
    }

    loadSeats();
  }, [date, trip.id]);

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
      <Card className="p-5">
        <div
          className="
            flex flex-col gap-4
            md:flex-row md:items-center md:justify-between
          "
        >
          {/* LEFT */}
          <div>
            <p className="text-sm text-slate-500">{trip.routeLabel}</p>

            <h3 className="mt-1 text-xl font-semibold">
              {trip.departureTime} → {trip.arrivalTime}
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              {trip.busType} bus ·{" "}
              {availableSeats !== null
                ? `${availableSeats} seats available`
                : "Loading..."}
            </p>
          </div>

          {/* RIGHT */}
          <div className="text-left md:text-right">
            <p className="text-2xl font-bold text-ecobus-red">
              {formatNaira(trip.price)}
            </p>
            <p className="text-sm text-slate-500">Per seat</p>
          </div>
        </div>

        {/* BUTTON */}
        <div className="mt-5 flex">
          <Link
            href={`/seats/${trip.id}?date=${encodeURIComponent(date)}`}
            onClick={() => {
              setTrip(trip);
              setTravelDate(date);
            }}
          >
            <Button className="w-full md:w-auto">
              Choose seats
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
