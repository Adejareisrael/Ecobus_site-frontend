import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

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
        seats: JSON.parse(b.seatsJson) as string[],
        passenger: {
          fullName: b.passengerName,
          phone: b.passengerPhone,
          email: b.passengerEmail,
        },
        paymentMethod: "Card",
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
