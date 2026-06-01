import { prisma } from "./prisma";
import { generateSeats } from "./mock-data";
import { Seat, Trip } from "./types";
import { formatBusLayout, toyotaLayoutId } from "./bus-layouts";

const blockingStatuses = ["Pending", "Confirmed"];

export async function getBookedSeatLabels(
  tripId: string,
  travelDate: string
): Promise<Set<string>> {
  const bookings = await prisma.booking.findMany({
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
  travelDate: string
): Promise<string[]> {
  const bookedSeats = await getBookedSeatLabels(tripId, travelDate);
  return selectedSeats.filter((seat) => bookedSeats.has(seat));
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
            { name: { contains: trip.busType } },
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
