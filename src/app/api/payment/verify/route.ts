import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(req: NextRequest) {
  try {
    const { reference, trip, seats, passenger } = await req.json();

    if (!reference || !trip || !seats?.length || !passenger) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify payment with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = (await paystackRes.json()) as PaystackVerifyResponse;

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 402 }
      );
    }

    // Verify amount paid matches what we expect (prevents underpayment attacks)
    const expectedKobo = trip.price * seats.length * 100;
    if (paystackData.data.amount !== expectedKobo) {
      return NextResponse.json(
        { error: "Payment amount does not match booking total" },
        { status: 402 }
      );
    }

    // Prevent duplicate booking for same reference
    const existing = await prisma.booking.findUnique({ where: { paystackRef: reference } });
    if (existing) {
      return NextResponse.json(formatBooking(existing, trip));
    }

    const payload = getTokenFromRequest(req);
    const bookingRef = `ECO-${Math.floor(100000 + Math.random() * 900000)}`;

    const booking = await prisma.booking.create({
      data: {
        reference: bookingRef,
        paystackRef: reference,
        tripId: trip.id,
        routeLabel: trip.routeLabel,
        departureTime: trip.departureTime,
        busType: trip.busType,
        price: trip.price,
        seatsJson: JSON.stringify(seats),
        passengerName: passenger.fullName,
        passengerPhone: passenger.phone,
        passengerEmail: passenger.email,
        userId: payload?.userId ?? null,
        status: "Confirmed",
      },
    });

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
    routeLabel: string;
    departureTime: string;
    busType: string;
    price: number;
    seatsJson: string;
    passengerName: string;
    passengerPhone: string;
    passengerEmail: string;
    status: string;
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
    seats: JSON.parse(b.seatsJson) as string[],
    passenger: {
      fullName: b.passengerName,
      phone: b.passengerPhone,
      email: b.passengerEmail,
    },
    paymentMethod: "Card",
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  };
}
