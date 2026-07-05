import {
  Seat,
  Terminal,
  Trip,
} from "./types";
import { normalizeTravelDate } from "./travel-date";

const isBrowser = () => typeof window !== "undefined";

/**
 *  Get all terminals
 */
export async function getTerminals(): Promise<Terminal[]> {
  if (!isBrowser()) {
    const { getDbTerminals } = await import("./server-data");
    return getDbTerminals();
  }

  const res = await fetch("/api/terminals");
  if (!res.ok) return [];
  return (await res.json()) as Terminal[];
}

/**
 *  Get trips (FILTERED)
 */
export async function getTrips(params: {
  from?: string;
  to?: string;
  date?: string;
}): Promise<Trip[]> {
  if (!isBrowser()) {
    const { getDbTrips } = await import("./server-data");
    return getDbTrips({ from: params.from, to: params.to });
  }

  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const res = await fetch(`/api/trips?${searchParams.toString()}`);
  if (!res.ok) return [];
  return (await res.json()) as Trip[];
}

/**
 *  Get single trip
 */
export async function getTripById(
  tripId: string
): Promise<Trip | undefined> {
  if (!isBrowser()) {
    const { getDbTripById } = await import("./server-data");
    return (await getDbTripById(tripId)) ?? undefined;
  }

  const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`);
  if (!res.ok) return undefined;
  return (await res.json()) as Trip;
}

/**
 *  Get seats for a trip
 * Includes booking state overlay
 */
export async function getSeats(
  tripId: string,
  date?: string | null
): Promise<Seat[]> {
  const travelDate = normalizeTravelDate(date);

  if (isBrowser()) {
    const params = new URLSearchParams({ date: travelDate });
    const res = await fetch(
      `/api/trips/${encodeURIComponent(tripId)}/seats?${params.toString()}`
    );
    if (!res.ok) return [];
    return (await res.json()) as Seat[];
  }

  const [{ getDbTripById }, { getDbSeatsForTrip }] = await Promise.all([
    import("./server-data"),
    import("./seat-availability"),
  ]);
  const trip = await getDbTripById(tripId);
  if (!trip) return [];
  return getDbSeatsForTrip(trip, travelDate);
}
