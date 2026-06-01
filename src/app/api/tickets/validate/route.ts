import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

function formatTicketValidation(
  booking: {
    id: string;
    reference: string;
    status: string;
    routeLabel: string;
    travelDate: string;
    departureTime: string;
    seatsJson: string;
    passengerName: string;
    passengerPhone: string;
    passengerEmail: string;
    checkedInAt?: Date | null;
    checkedInBy?: string | null;
  }
) {
  return {
    valid: booking.status === "Confirmed",
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    routeLabel: booking.routeLabel,
    travelDate: booking.travelDate,
    departureTime: booking.departureTime,
    seats: JSON.parse(booking.seatsJson) as string[],
    checkedIn: Boolean(booking.checkedInAt),
    checkedInAt: booking.checkedInAt?.toISOString() ?? null,
    checkedInBy: booking.checkedInBy ?? null,
    passenger: {
      fullName: booking.passengerName,
      phone: booking.passengerPhone,
      email: booking.passengerEmail,
    },
  };
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const bookingId = req.nextUrl.searchParams.get("bookingId")?.trim();
  const reference = req.nextUrl.searchParams.get("reference")?.trim();

  if (!bookingId && !reference) {
    return NextResponse.json(
      { error: "Booking ID or reference is required" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findFirst({
    where: bookingId ? { id: bookingId } : { reference },
  });

  if (!booking) {
    return NextResponse.json({ valid: false, error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json(formatTicketValidation(booking));
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const { bookingId, reference } = (await req.json()) as {
    bookingId?: string;
    reference?: string;
  };

  const cleanBookingId = bookingId?.trim();
  const cleanReference = reference?.trim();

  if (!cleanBookingId && !cleanReference) {
    return NextResponse.json(
      { error: "Booking ID or reference is required" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findFirst({
    where: cleanBookingId ? { id: cleanBookingId } : { reference: cleanReference },
  });

  if (!booking) {
    return NextResponse.json({ valid: false, error: "Ticket not found" }, { status: 404 });
  }

  if (booking.status !== "Confirmed") {
    return NextResponse.json(
      {
        ...formatTicketValidation(booking),
        error: "Only confirmed tickets can be checked in.",
      },
      { status: 409 }
    );
  }

  if (booking.checkedInAt) {
    return NextResponse.json(
      {
        ...formatTicketValidation(booking),
        error: "Ticket has already been checked in.",
      },
      { status: 409 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      checkedInAt: new Date(),
      checkedInBy: admin.email,
    },
  });

  return NextResponse.json(formatTicketValidation(updated));
}
