"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { BarChart3, BusFront, CalendarClock, Ticket } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Booking, CharterRequest, Trip } from "@/lib/types";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function AdminReportsPage() {
  const token = useAuthStore((state) => state.token);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [charters, setCharters] = useState<CharterRequest[]>([]);

  useEffect(() => {
    if (!token) return;

    async function loadReports() {
      const [bookingsRes, tripsRes, chartersRes] = await Promise.all([
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/trips?includeInactive=true", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/charter-requests", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (bookingsRes.ok) setBookings((await bookingsRes.json()) as Booking[]);
      if (tripsRes.ok) setTrips((await tripsRes.json()) as Trip[]);
      if (chartersRes.ok) setCharters((await chartersRes.json()) as CharterRequest[]);
    }

    void loadReports();
  }, [token]);

  const confirmedBookings = bookings.filter((booking) => booking.status === "Confirmed");
  const revenue = confirmedBookings.reduce(
    (sum, booking) => sum + getBookingTotal(booking.trip.price, booking.seats.length),
    0
  );
  const seatsSold = confirmedBookings.reduce((sum, booking) => sum + booking.seats.length, 0);

  const routeMap = new Map<string, { route: string; bookings: number; revenue: number }>();
  for (const booking of confirmedBookings) {
    const current = routeMap.get(booking.trip.routeLabel) ?? {
      route: booking.trip.routeLabel,
      bookings: 0,
      revenue: 0,
    };
    current.bookings += 1;
    current.revenue += getBookingTotal(booking.trip.price, booking.seats.length);
    routeMap.set(booking.trip.routeLabel, current);
  }
  const routeStats = [...routeMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Operational snapshot for bookings, routes, and hire enquiries.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Ticket} label="Confirmed bookings" value={String(confirmedBookings.length)} />
        <Metric icon={BarChart3} label="Confirmed revenue" value={formatNaira(revenue)} />
        <Metric icon={CalendarClock} label="Seats sold" value={String(seatsSold)} />
        <Metric icon={BusFront} label="Vehicle hire requests" value={String(charters.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Top routes</h2>
          <div className="mt-4 space-y-3">
            {routeStats.length === 0 ? (
              <p className="text-sm text-slate-500">No confirmed route revenue yet.</p>
            ) : (
              routeStats.map((item) => (
                <div key={item.route} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{item.route}</p>
                    <p className="font-semibold text-ecobus-red">{formatNaira(item.revenue)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.bookings} booking(s)</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Trip coverage</h2>
          <div className="mt-4 space-y-3">
            <ReportLine label="Active trips" value={String(trips.filter((trip) => trip.isActive !== false).length)} />
            <ReportLine label="Inactive trips" value={String(trips.filter((trip) => trip.isActive === false).length)} />
            <ReportLine label="Average fare" value={formatNaira(Math.round(trips.reduce((sum, trip) => sum + trip.price, 0) / Math.max(trips.length, 1)))} />
            <ReportLine label="Open hire leads" value={String(charters.filter((item) => item.status !== "Closed").length)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-ecobus-red" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
