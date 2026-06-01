import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference")?.trim();
  const contact = req.nextUrl.searchParams.get("contact")?.trim().toLowerCase();

  if (!reference || !contact) {
    return NextResponse.json(
      { error: "Reference and email or phone are required" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      reference,
      OR: [
        { passengerEmail: contact },
        { passengerPhone: contact },
      ],
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    reference: booking.reference,
    routeLabel: booking.routeLabel,
    travelDate: booking.travelDate,
    departureTime: booking.departureTime,
    seats: JSON.parse(booking.seatsJson) as string[],
    passengerName: booking.passengerName,
    status: booking.status,
  });
}
