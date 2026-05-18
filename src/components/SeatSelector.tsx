"use client";

import { Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/store/booking-store";
import { useMemo } from "react";

type Props = {
  seats: Seat[];
};

export function SeatSelector({ seats }: Props) {
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);

  /**
   * 🧠 Stable grouping (prevents layout bugs)
   */
  const groupedSeats = useMemo(() => {
    const map: Record<number, Seat[]> = {};

    for (const seat of seats) {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
    }

    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([row, seats]) => ({
        row: Number(row),
        seats,
      }));
  }, [seats]);

  const frontSeat = seats.find((s) => s.row === 0);

  const renderSeat = (seat: Seat) => {
    const isSelected = selectedSeats.includes(seat.label);

    return (
      <button
        key={seat.id}
        disabled={!seat.isAvailable}
        onClick={() => toggleSeat(seat.label)}
        className={cn(
          "h-12 w-12 rounded-lg text-xs font-semibold transition",
          !seat.isAvailable &&
            "cursor-not-allowed bg-slate-100 text-slate-400",
          isSelected && "bg-ecobus-red text-white",
          seat.isAvailable &&
            !isSelected &&
            "bg-white border border-slate-200 hover:border-ecobus-red hover:bg-ecobus-light"
        )}
      >
        {seat.label}
      </button>
    );
  };

  return (
    <div className="space-y-6">

      {/* FRONT SECTION */}
      <div className="flex items-center justify-between px-6">
        <div className="text-xs text-slate-500">Driver</div>

        {frontSeat && (
          <div className="opacity-60 pointer-events-none">
            {renderSeat(frontSeat)}
          </div>
        )}
      </div>

      {/* SEAT GRID */}
      <div className="mx-auto w-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        {groupedSeats.map(({ row, seats }) => {
          if (row === 0) return null;

          return (
            <div key={row} className="flex items-center gap-8">

              {/* LEFT SIDE */}
              <div className="flex gap-2">
                {seats
                  .filter((s) => s.column < 2)
                  .map(renderSeat)}
              </div>

              {/* AISLE */}
              <div className="w-6" />

              {/* RIGHT SIDE */}
              <div className="flex gap-2">
                {seats
                  .filter((s) => s.column >= 2)
                  .map(renderSeat)}
              </div>

            </div>
          );
        })}

      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-white border"></span> Available
        </span>

        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-ecobus-red"></span> Selected
        </span>

        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-slate-200"></span> Booked
        </span>
      </div>

    </div>
  );
}