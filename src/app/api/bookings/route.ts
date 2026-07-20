import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";
import { getUnavailableSelectedSeats, withSeatLock } from "@/lib/seat-availability";
import { normalizeTravelDate } from "@/lib/travel-date";
import {
  formatPromoCode,
  normalizePromoCode,
  validatePromoForTotal,
} from "@/lib/promo-codes";
import { enqueueTicketDeliveries } from "@/lib/ticket-delivery";

class SeatConflictError extends Error {
  constructor(public readonly seats: string[]) {
    super(`Seat${seats.length > 1 ? "s" : ""} already booked: ${seats.join(", ")}`);
  }
}

class PromoConflictError extends Error {
  constructor() {
    super("Promo code has reached its usage limit");
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getTokenFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = payload.role === "admin" ? {} : { userId: payload.userId };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      bookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        trip: {
          id: b.tripId,
          routeLabel: b.routeLabel,
          departureTime: b.departureTime,
          arrivalTime: "",
          busType: b.busType,
          price: b.price,
          availableSeats: 0,
          departureTerminalId: "",
          destinationTerminalId: "",
        },
        travelDate: b.travelDate,
        seats: JSON.parse(b.seatsJson) as string[],
        passenger: {
          fullName: b.passengerName,
          phone: b.passengerPhone,
          email: b.passengerEmail,
        },
        promoCode: b.promoCode,
        discountAmount: b.discountAmount,
        status: b.status,
        checkedInAt: b.checkedInAt?.toISOString() ?? null,
        checkedInBy: b.checkedInBy ?? null,
        createdAt: b.createdAt.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { trip, travelDate, seats, passenger, promoCode } = await req.json();

    if (!trip || !seats?.length || !passenger) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bookingTotal = trip.price * seats.length;
    let discountAmount = 0;
    let normalizedPromoCode: string | null = null;
    let promoMaxUses: number | null = null;

    if (promoCode) {
      normalizedPromoCode = normalizePromoCode(String(promoCode));
      const promo = await prisma.promoCode.findUnique({
        where: { code: normalizedPromoCode },
      });

      if (!promo) {
        return NextResponse.json({ error: "Promo code not found" }, { status: 400 });
      }

      const result = validatePromoForTotal(formatPromoCode(promo), bookingTotal);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      promoMaxUses = promo.maxUses;
      discountAmount = result.discountAmount;
    }

    const bookingTravelDate = normalizeTravelDate(travelDate);
    const payload = getTokenFromRequest(req);
    const bookingRef = `ECO-${Math.floor(100000 + Math.random() * 900000)}`;

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) =>
        withSeatLock(tx, trip.id, bookingTravelDate, async () => {
          const unavailableSeats = await getUnavailableSelectedSeats(
            trip.id,
            seats,
            bookingTravelDate,
            tx
          );

          if (unavailableSeats.length > 0) {
            throw new SeatConflictError(unavailableSeats);
          }

          const created = await tx.booking.create({
            data: {
              reference: bookingRef,
              tripId: trip.id,
              travelDate: bookingTravelDate,
              routeLabel: trip.routeLabel,
              departureTime: trip.departureTime,
              busType: trip.busType,
              price: trip.price,
              promoCode: normalizedPromoCode,
              discountAmount,
              seatsJson: JSON.stringify(seats),
              passengerName: passenger.fullName,
              passengerPhone: passenger.phone,
              passengerEmail: passenger.email,
              userId: payload?.userId ?? null,
              status: "Pending",
            },
          });

          if (normalizedPromoCode) {
            // Atomic conditional increment: only succeeds if usedCount is still
            // under the limit at the moment of the update, so two concurrent
            // reservations can't both slip in under a promo's last remaining use.
            const promoUpdate = await tx.promoCode.updateMany({
              where:
                promoMaxUses === null
                  ? { code: normalizedPromoCode }
                  : { code: normalizedPromoCode, usedCount: { lt: promoMaxUses } },
              data: { usedCount: { increment: 1 } },
            });

            if (promoUpdate.count === 0) {
              throw new PromoConflictError();
            }
          }

          return created;
        })
      );
    } catch (error) {
      if (error instanceof SeatConflictError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error instanceof PromoConflictError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }

    await enqueueTicketDeliveries(booking, new URL(req.url).origin);

    return NextResponse.json(formatBooking(booking, trip), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatBooking(
  b: {
    id: string;
    reference: string;
    tripId: string;
    travelDate: string;
    routeLabel: string;
    departureTime: string;
    busType: string;
    price: number;
    promoCode?: string | null;
    discountAmount?: number | null;
    seatsJson: string;
    passengerName: string;
    passengerPhone: string;
    passengerEmail: string;
    status: string;
    checkedInAt?: Date | null;
    checkedInBy?: string | null;
    createdAt: Date;
  },
  trip: { id: string; departureTerminalId: string; destinationTerminalId: string; arrivalTime: string; availableSeats: number }
) {
  return {
    id: b.id,
    reference: b.reference,
    trip: {
      id: b.tripId,
      departureTerminalId: trip.departureTerminalId,
      destinationTerminalId: trip.destinationTerminalId,
      departureTime: b.departureTime,
      arrivalTime: trip.arrivalTime,
      price: b.price,
      availableSeats: trip.availableSeats,
      busType: b.busType,
      routeLabel: b.routeLabel,
    },
    travelDate: b.travelDate,
    seats: JSON.parse(b.seatsJson) as string[],
    passenger: {
      fullName: b.passengerName,
      phone: b.passengerPhone,
      email: b.passengerEmail,
    },
    promoCode: b.promoCode ?? null,
    discountAmount: b.discountAmount ?? 0,
    status: b.status,
    checkedInAt: b.checkedInAt?.toISOString() ?? null,
    checkedInBy: b.checkedInBy ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}
