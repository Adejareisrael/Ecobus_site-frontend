import {
  Booking,
  Passenger,
  Seat,
  Terminal,
  Trip,
} from "./types";
import { normalizeTravelDate } from "./travel-date";
import { bookings } from "./mock-data";

const delay = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isBrowser = () => typeof window !== "undefined";

const seatCache: Record<string, Seat[]> = {};
const bookedSeatsByTrip: Record<string, Set<string>> = {};

/**
 * 🏢 Get all terminals
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
 * 🚌 Get trips (FILTERED)
 * Now uses terminal IDs (correct architecture)
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
 * 🧭 Get single trip
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
 * 💺 Get seats for a trip
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

/**
 * 🎫 Create booking (mock DB write)
 */
export async function createBooking(input: {
  trip: Trip;
  travelDate?: string | null;
  seats: string[];
  passenger: Passenger;
  paymentMethod: "Card" | "Transfer";
}): Promise<Booking> {
  await delay(700);
  const travelDate = normalizeTravelDate(input.travelDate);
  const cacheKey = `${input.trip.id}:${travelDate}`;

  if (!bookedSeatsByTrip[cacheKey]) {
    bookedSeatsByTrip[cacheKey] = new Set();
  }

  const booked = bookedSeatsByTrip[cacheKey];

  input.seats.forEach((seat) => {
    booked.add(seat);
  });

  delete seatCache[cacheKey];

  const booking: Booking = {
    id: crypto.randomUUID(),
    reference: `ECO-${Math.floor(100000 + Math.random() * 900000)}`,
    trip: input.trip,
    travelDate,
    seats: input.seats,
    passenger: input.passenger,
    paymentMethod: input.paymentMethod,
    createdAt: new Date().toISOString(),
    status: "Confirmed",
  };

  bookings.unshift(booking);
  return booking;
}

/**
 * 📦 Get all bookings (admin/dashboard)
 */
export async function getBookings(): Promise<Booking[]> {
  await delay();
  return bookings;
}
