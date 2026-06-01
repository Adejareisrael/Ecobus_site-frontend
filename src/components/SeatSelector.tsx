"use client";

import { Seat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/store/booking-store";
import { useEffect, useMemo } from "react";

type Props = {
  seats: Seat[];
};

export function SeatSelector({ seats }: Props) {
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const clearSeats = useBookingStore((state) => state.clearSeats);
  const seatByLabel = useMemo(
    () => new Map(seats.map((seat) => [seat.label, seat])),
    [seats]
  );
  const isToyotaLayout =
    seats.length === 14 &&
    Array.from({ length: 14 }, (_, index) => String(index + 1)).every((label) =>
      seatByLabel.has(label)
    );

  useEffect(() => {
    if (selectedSeats.some((seat) => !seatByLabel.has(seat))) clearSeats();
  }, [clearSeats, seatByLabel, selectedSeats]);

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

  const renderPassage = () => (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      Aisle
    </div>
  );

  const renderEmptyCell = (key: string) => <div key={key} className="h-12 w-12" />;

  const renderToyotaCell = (label: string | "captain" | "aisle" | null, key: string) => {
    if (label === null) return renderEmptyCell(key);

    if (label === "captain") {
      return (
        <div
          key={key}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-semibold uppercase text-white"
        >
          Captain
        </div>
      );
    }

    if (label === "aisle") {
      return <div key={key}>{renderPassage()}</div>;
    }

    const seat = seatByLabel.get(label);
    return seat ? renderSeat(seat) : renderEmptyCell(key);
  };

  if (isToyotaLayout) {
    const rows: Array<Array<string | "captain" | "aisle" | null>> = [
      ["captain", null, null, "1"],
      ["2", "3", "4", "aisle"],
      ["5", "6", "aisle", "7"],
      ["8", "9", "aisle", "10"],
      ["11", "12", "13", "14"],
    ];

    return (
      <div className="space-y-6">
        <div className="mx-auto w-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-4 gap-2"
              aria-label={`Seat row ${rowIndex + 1}`}
            >
              {row.map((cell, cellIndex) =>
                renderToyotaCell(cell, `${rowIndex}-${cellIndex}`)
              )}
            </div>
          ))}
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
