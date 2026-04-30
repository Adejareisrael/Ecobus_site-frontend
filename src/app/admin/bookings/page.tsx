"use client";

import { getBookings } from "@/lib/api";
import { useEffect, useState } from "react";
import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getBookings();
      setBookings(data);
      setLoading(false);
    }
    load();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-50 text-emerald-600";
      case "Pending":
        return "bg-yellow-50 text-yellow-600";
      case "Cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">
          Bookings
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          All customer bookings
        </p>
      </div>

      {/* GRID */}
      <div className="space-y-4">

        {loading ? (
          <p className="text-slate-500">Loading bookings...</p>
        ) : (
          bookings.map((b) => (
            <Card
              key={b.id}
              className="p-5 hover:shadow-md transition"
            >

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                {/* LEFT */}
                <div className="space-y-1">

                  <p className="font-semibold">
                    {b.reference}
                  </p>

                  <p className="text-sm text-slate-500">
                    {b.trip.routeLabel}
                  </p>

                  <p className="text-sm">
                    Passenger: {b.passenger.fullName}
                  </p>

                  <p className="text-sm text-slate-600">
                    Seats: {b.seats.join(", ")}
                  </p>

                </div>

                {/* RIGHT */}
                <div className="text-left md:text-right space-y-2">

                  <p className="text-lg font-bold text-ecobus-red">
                    {formatNaira(
                      getBookingTotal(
                        b.trip.price,
                        b.seats.length
                      )
                    )}
                  </p>

                  {/* STATUS BADGE */}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>

                  {/* ACTIONS */}
                  <div className="flex gap-2 md:justify-end pt-2">

                    <Button
                      variant="secondary"
                      className="text-xs"
                    >
                      View
                    </Button>

                    <Button
                      variant="ghost"
                      className="text-xs text-red-500"
                    >
                      Cancel
                    </Button>

                  </div>

                </div>

              </div>

            </Card>
          ))
        )}

      </div>

    </div>
  );
}