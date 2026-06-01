import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";
import { BookingStatus } from "@/lib/types";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

const bookingStatuses: BookingStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Failed",
  "Refunded",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const payload = getTokenFromRequest(req);

    const { bookingId } = await params;
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!b) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // A guest ticket URL acts as the customer's receipt link after payment.
    // Authenticated customer bookings remain scoped to their owner.
    if (payload && payload.role !== "admin" && b.userId && b.userId !== payload.userId) {
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
      travelDate: b.travelDate,
      seats: JSON.parse(b.seatsJson) as string[],
      passenger: {
        fullName: b.passengerName,
        phone: b.passengerPhone,
        email: b.passengerEmail,
      },
      paymentMethod: "Card",
      promoCode: b.promoCode,
      discountAmount: b.discountAmount,
      status: b.status,
      checkedInAt: b.checkedInAt?.toISOString() ?? null,
      checkedInBy: b.checkedInBy ?? null,
      paymentStatus: b.paymentStatus,
      amountPaid: b.amountPaid,
      currency: b.currency,
      paidAt: b.paidAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const { status } = (await req.json()) as { status?: BookingStatus };
    if (!status || !bookingStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }

    const { bookingId } = await params;
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json({
      id: booking.id,
      reference: booking.reference,
      trip: {
        id: booking.tripId,
        routeLabel: booking.routeLabel,
        departureTime: booking.departureTime,
        arrivalTime: "",
        busType: booking.busType,
        price: booking.price,
        availableSeats: 0,
        departureTerminalId: "",
        destinationTerminalId: "",
      },
      travelDate: booking.travelDate,
      seats: JSON.parse(booking.seatsJson) as string[],
      passenger: {
        fullName: booking.passengerName,
        phone: booking.passengerPhone,
        email: booking.passengerEmail,
      },
      paymentMethod: "Card",
      promoCode: booking.promoCode,
      discountAmount: booking.discountAmount,
      status: booking.status,
      checkedInAt: booking.checkedInAt?.toISOString() ?? null,
      checkedInBy: booking.checkedInBy ?? null,
      createdAt: booking.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
