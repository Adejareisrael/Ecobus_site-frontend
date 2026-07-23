import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

function formatBooking(booking: {
  id: string;
  reference: string;
  routeLabel: string;
  travelDate: string;
  departureTime: string;
  seatsJson: string;
  passengerName: string;
  status: string;
  createdAt: Date;
}) {
  return {
    id: booking.id,
    reference: booking.reference,
    routeLabel: booking.routeLabel,
    travelDate: booking.travelDate,
    departureTime: booking.departureTime,
    seats: JSON.parse(booking.seatsJson) as string[],
    passengerName: booking.passengerName,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  const reference = req.nextUrl.searchParams.get("reference")?.trim().toUpperCase();
  const contact = req.nextUrl.searchParams.get("contact")?.trim().toLowerCase();

  if (payload) {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: payload.userId,
        ...(reference ? { reference: { contains: reference, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ bookings: bookings.map(formatBooking) });
  }

  if (!contact) {
    return NextResponse.json(
      { error: "Email or phone is required" },
      { status: 400 }
    );
  }

  const rate = checkRateLimit(getClientKey("bookings-lookup", req, contact), {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (rate.limited) {
    return NextResponse.json(
      { error: "Too many lookup attempts. Please try again later." },
      { status: 429 }
    );
  }

  const bookings = await prisma.booking.findMany({
    where: {
      ...(reference ? { reference: { contains: reference, mode: "insensitive" } } : {}),
      OR: [
        { passengerEmail: contact },
        { passengerPhone: contact },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (bookings.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ bookings: bookings.map(formatBooking) });
}
