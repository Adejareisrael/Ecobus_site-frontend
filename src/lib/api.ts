import { bookings, generateSeats, terminals, trips } from "./mock-data";
import { Booking, Passenger, Seat, Terminal, Trip } from "./types";

const delay = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 🧠 In-memory state (mock DB layer)
 */
const seatCache: Record<string, Seat[]> = {};
const bookedSeatsByTrip: Record<string, Set<string>> = {};

/**
 * 🏢 Get all terminals
 */
export async function getTerminals(): Promise<Terminal[]> {
  await delay();
  return terminals;
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
  await delay();

  const { from, to } = params;

  return trips.filter((trip) => {
    const matchesFrom = from
      ? trip.departureTerminalId === from
      : true;

    const matchesTo = to
      ? trip.destinationTerminalId === to
      : true;

    return matchesFrom && matchesTo;
  });
}

/**
 * 🧭 Get single trip
 */
export async function getTripById(
  tripId: string
): Promise<Trip | undefined> {
  await delay();
  return trips.find((trip) => trip.id === tripId);
}

/**
 * 💺 Get seats for a trip
 * Includes booking state overlay
 */
export async function getSeats(tripId: string): Promise<Seat[]> {
  await delay();

  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return [];

  if (!bookedSeatsByTrip[tripId]) {
    bookedSeatsByTrip[tripId] = new Set();
  }

  const booked = bookedSeatsByTrip[tripId];

  if (!seatCache[tripId]) {
    seatCache[tripId] = generateSeats(trip.busType);
  }

  return seatCache[tripId].map((seat) => ({
    ...seat,
    isAvailable: !booked.has(seat.label),
  }));
}

/**
 * 🎫 Create booking (mock DB write)
 */
export async function createBooking(input: {
  trip: Trip;
  seats: string[];
  passenger: Passenger;
  paymentMethod: "Card" | "Transfer";
}): Promise<Booking> {
  await delay(700);

  if (!bookedSeatsByTrip[input.trip.id]) {
    bookedSeatsByTrip[input.trip.id] = new Set();
  }

  const booked = bookedSeatsByTrip[input.trip.id];

  input.seats.forEach((seat) => {
    booked.add(seat);
  });

  delete seatCache[input.trip.id];

  const booking: Booking = {
    id: crypto.randomUUID(),
    reference: `ECO-${Math.floor(100000 + Math.random() * 900000)}`,
    trip: input.trip,
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