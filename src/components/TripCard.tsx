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

type Props = {
  trip: Trip;
};

export function TripCard({ trip }: Props) {
  const setTrip = useBookingStore((state) => state.setTrip);
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);

  useEffect(() => {
    async function loadSeats() {
      const seats: Seat[] = await getSeats(trip.id);
      setAvailableSeats(seats.filter((s) => s.isAvailable).length);
    }

    loadSeats();
  }, [trip.id]);

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
          <Link href={`/seats/${trip.id}`} onClick={() => setTrip(trip)}>
            <Button className="w-full md:w-auto">
              Choose seats
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}