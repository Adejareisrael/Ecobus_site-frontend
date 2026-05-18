import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const payload = getTokenFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!b) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Non-admin users can only fetch their own bookings
    if (payload.role !== "admin" && b.userId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
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
      seats: JSON.parse(b.seatsJson) as string[],
      passenger: {
        fullName: b.passengerName,
        phone: b.passengerPhone,
        email: b.passengerEmail,
      },
      paymentMethod: "Card",
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
