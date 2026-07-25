"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Trip } from "@/lib/types";
import { getTrips } from "@/lib/api";
import { TripCard } from "./TripCard";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
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
  const [locationQuery, setLocationQuery] = useState("");
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
     * 📍 LOCATION FILTER
     */
    const query = locationQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((trip) => trip.routeLabel.toLowerCase().includes(query));
    }

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
  }, [priceSort, timeSort, locationQuery, visibleTrips]);

  return (
    <div className="space-y-5">

      {/* FILTER CONTROLS */}
      <Card className="grid gap-4 p-4 md:grid-cols-3">

        <label className="relative flex items-center md:col-span-1">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by location (e.g. Lagos, Benin)"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="pl-10"
          />
        </label>

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
          <option value="morning">Morning (12 AM–12 PM)</option>
          <option value="afternoon">Afternoon (12 PM–6 PM)</option>
          <option value="evening">Evening (6 PM+)</option>
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
