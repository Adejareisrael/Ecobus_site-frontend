"use client";

import { useBookingStore } from "@/store/booking-store";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import { Card } from "./ui/Card";

export function BookingSummary() {
  const trip = useBookingStore((state) => state.selectedTrip);
  const seats = useBookingStore((state) => state.selectedSeats);

  if (!trip) return null;

  const seatCount = seats?.length ?? 0;
  const total = getBookingTotal(trip.price, seatCount);

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">Booking Summary</h3>

      <div className="mt-4 space-y-3 text-sm text-slate-600">

        <div className="flex justify-between">
          <span>Route</span>
          <span className="font-medium text-slate-900">
            {trip.routeLabel}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Departure</span>
          <span className="font-medium text-slate-900">
            {trip.departureTime}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Seats</span>
          <span className="font-medium text-slate-900">
            {seatCount > 0 ? seats.join(", ") : "No seats selected"}
          </span>
        </div>

        <div className="border-t pt-3 flex justify-between">
          <span>Total</span>
          <span className="font-bold text-ecobus-red">
            {seatCount > 0 ? formatNaira(total) : "₦0"}
          </span>
        </div>

      </div>
    </Card>
  );
}