"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookings } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      router.replace("/login");
    }
  }, [authChecked, user, router]);

  useEffect(() => {
    async function load() {
      const data = await getBookings();
      setBookings(data);
      setLoading(false);
    }
    load();
  }, []);

  const totalBookings = bookings.length;
  const totalSpent = bookings.reduce(
    (acc, b) =>
      acc + getBookingTotal(b.trip.price, b.seats.length),
    0
  );

  const activeTrips = bookings.filter(
    (b) => b.status === "Confirmed"
  ).length;

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          My Dashboard
        </h1>

        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Manage your bookings and travel history
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Bookings</p>
          <h2 className="text-2xl font-bold mt-1">
            {loading ? "..." : totalBookings}
          </h2>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Spent</p>
          <h2 className="text-2xl font-bold mt-1 text-ecobus-red">
            {loading ? "..." : formatNaira(totalSpent)}
          </h2>
        </Card>

        {/* Always visible now */}
        <Card className="p-5">
          <p className="text-sm text-slate-500">Active Trips</p>
          <h2 className="text-2xl font-bold mt-1 text-ecobus-purple">
            {loading ? "..." : activeTrips}
          </h2>
        </Card>

      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-4">

        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
                <div className="h-3 w-60 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-48 bg-slate-200 rounded" />
              </Card>
            ))}
          </>
        ) : bookings.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <p className="text-slate-600 font-medium">
              No bookings yet
            </p>

            <p className="text-sm text-slate-500">
              Start your first journey with Ecobus 🚍
            </p>

            <Link href="/search">
              <Button className="bg-ecobus-red text-white mt-2">
                Book a trip
              </Button>
            </Link>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card
              key={booking.id}
              className="p-5 hover:shadow-md transition"
            >

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                {/* LEFT */}
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-semibold">
                    {booking.trip.routeLabel}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {booking.trip.departureTime} • {booking.trip.busType}
                  </p>

                  <p className="text-sm text-slate-600">
                    Passenger: {booking.passenger.fullName}
                  </p>

                  <p className="text-sm text-slate-600">
                    Seats: {booking.seats.join(", ")}
                  </p>
                </div>

                {/* RIGHT */}
                <div className="text-left md:text-right space-y-1">

                  <p className="text-lg font-bold text-ecobus-red">
                    {formatNaira(
                      getBookingTotal(
                        booking.trip.price,
                        booking.seats.length
                      )
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    Ref: {booking.reference}
                  </p>

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>

                </div>

              </div>

            </Card>
          ))
        )}

      </div>

    </div>
  );
}