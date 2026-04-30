"use client";

import { trips } from "@/lib/mock-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminTripsPage() {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">
          Trips
        </h1>

        <p className="text-sm lg:text-base text-slate-500 mt-1">
          Manage routes and schedules
        </p>
      </div>

      {/* GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {trips.map((trip) => (
          <Card
            key={trip.id}
            className="p-5 space-y-3 hover:shadow-md transition"
          >

            {/* ROUTE */}
            <div className="flex items-start justify-between gap-2">

              <p className="font-semibold text-base">
                {trip.routeLabel}
              </p>

              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                Active
              </span>

            </div>

            {/* TIME */}
            <p className="text-sm text-slate-500">
              {trip.departureTime} → {trip.arrivalTime}
            </p>

            {/* BUS TYPE */}
            <p className="text-sm">
              Bus: <span className="font-medium">{trip.busType}</span>
            </p>

            {/* PRICE */}
            <p className="text-lg font-bold text-ecobus-red">
              ₦{trip.price.toLocaleString()}
            </p>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-2">

              <Button
                variant="secondary"
                className="w-full text-xs"
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs text-red-500"
              >
                Delete
              </Button>

            </div>

          </Card>
        ))}

      </div>

    </div>
  );
}