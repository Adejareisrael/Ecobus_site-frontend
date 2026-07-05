import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { generateSeats } from "./mock-data";
import { Seat, Trip } from "./types";
import { formatBusLayout, toyotaLayoutId } from "./bus-layouts";

const blockingStatuses = ["Pending", "Confirmed"];

type Db = typeof prisma | Prisma.TransactionClient;

export async function getBookedSeatLabels(
  tripId: string,
  travelDate: string,
  db: Db = prisma
): Promise<Set<string>> {
  const bookings = await db.booking.findMany({
    where: {
      tripId,
      travelDate,
      status: { in: blockingStatuses },
    },
    select: { seatsJson: true },
  });

  return new Set(
    bookings.flatMap((booking) => JSON.parse(booking.seatsJson) as string[])
  );
}

export async function getUnavailableSelectedSeats(
  tripId: string,
  selectedSeats: string[],
  travelDate: string,
  db: Db = prisma
): Promise<string[]> {
  const bookedSeats = await getBookedSeatLabels(tripId, travelDate, db);
  return selectedSeats.filter((seat) => bookedSeats.has(seat));
}

/**
 * Serializes concurrent booking attempts for the same trip + travel date so
 * the seat-availability check and the booking insert can't race each other.
 * Postgres advisory locks are session/transaction scoped, not tied to any
 * table, so this doesn't require a schema change.
 */
export async function withSeatLock<T>(
  tx: Prisma.TransactionClient,
  tripId: string,
  travelDate: string,
  fn: () => Promise<T>
): Promise<T> {
  const lockKey = `${tripId}:${travelDate}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;
  return fn();
}

export async function getDbSeatsForTrip(
  trip: Trip,
  travelDate: string
): Promise<Seat[]> {
  const bookedSeats = await getBookedSeatLabels(trip.id, travelDate);
  const layout = await prisma.busLayout.findFirst({
    where: trip.busLayoutId
      ? { id: trip.busLayoutId }
      : {
          OR: [
            { id: toyotaLayoutId },
            { model: trip.busType },
            { name: { contains: trip.busType, mode: "insensitive" } },
          ],
        },
    orderBy: { isDefault: "desc" },
  });

  const baseSeats = layout
    ? formatBusLayout(layout).seats
    : generateSeats(trip.busType, trip.availableSeats);

  return baseSeats.map((seat) => ({
    ...seat,
    isAvailable: seat.isAvailable && !bookedSeats.has(seat.label),
  }));
}
