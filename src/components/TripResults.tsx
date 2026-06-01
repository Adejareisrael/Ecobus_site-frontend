"use client";

import { useEffect, useMemo, useState } from "react";
import { Trip } from "@/lib/types";
import { getTrips } from "@/lib/api";
import { TripCard } from "./TripCard";
import { Select } from "./ui/Select";
import { Card } from "./ui/Card";

type PriceSort = "all" | "low" | "high";
type TimeFilter = "all" | "morning" | "afternoon" | "evening";

type Props = {
  trips: Trip[];
  searchParams?: { from?: string; to?: string; date?: string };
};

function getHour(time: string) {
  // safer parsing for "HH:MM"
  return parseInt(time.split(":")[0], 10);
}

export function TripResults({ trips, searchParams = {} }: Props) {
  const [priceSort, setPriceSort] = useState<PriceSort>("all");
  const [timeSort, setTimeSort] = useState<TimeFilter>("all");
  const [visibleTrips, setVisibleTrips] = useState(trips);

  useEffect(() => {
    let cancelled = false;

    async function syncTrips() {
      const latestTrips = await getTrips(searchParams);
      if (!cancelled) setVisibleTrips(latestTrips);
    }

    void syncTrips();

    const handleTripStorageChange = () => {
      void syncTrips();
    };

    window.addEventListener("storage", handleTripStorageChange);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleTripStorageChange);
    };
  }, [searchParams]);

  const filteredTrips = useMemo(() => {
    let list = [...visibleTrips];

    /**
     * 🕒 TIME FILTER FIRST (narrowing logic)
     */
    if (timeSort !== "all") {
      list = list.filter((trip) => {
        const hour = getHour(trip.departureTime);

        if (timeSort === "morning") return hour < 12;
        if (timeSort === "afternoon") return hour >= 12 && hour < 18;
        if (timeSort === "evening") return hour >= 18;

        return true;
      });
    }

    /**
     * 💰 SORTING AFTER FILTERING
     */
    if (priceSort === "low") {
      list.sort((a, b) => a.price - b.price);
    }

    if (priceSort === "high") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [priceSort, timeSort, visibleTrips]);

  return (
    <div className="space-y-5">

      {/* FILTER CONTROLS */}
      <Card className="grid gap-4 p-4 md:grid-cols-2">

        <Select
          value={priceSort}
          onChange={(e) => setPriceSort(e.target.value as PriceSort)}
        >
          <option value="all">Sort by price</option>
          <option value="low">Lowest first</option>
          <option value="high">Highest first</option>
        </Select>

        <Select
          value={timeSort}
          onChange={(e) => setTimeSort(e.target.value as TimeFilter)}
        >
          <option value="all">Filter by departure time</option>
          <option value="morning">Morning (00–12)</option>
          <option value="afternoon">Afternoon (12–18)</option>
          <option value="evening">Evening (18+)</option>
        </Select>

      </Card>

      {/* RESULTS */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No trips found for this route.
          </Card>
        ) : (
          filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} travelDate={searchParams.date} />
          ))
        )}
      </div>

    </div>
  );
}
