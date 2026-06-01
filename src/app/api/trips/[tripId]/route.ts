import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatTrip, getDbTripById } from "@/lib/server-data";
import { Trip } from "@/lib/types";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

function validateTrip(input: Partial<Trip>) {
  const price = Number(input.price);
  const availableSeats =
    input.busType === "Toyota" ? 14 : Number(input.availableSeats);

  if (
    !input.departureTerminalId ||
    !input.destinationTerminalId ||
    input.departureTerminalId === input.destinationTerminalId ||
    !input.departureTime ||
    !input.arrivalTime ||
    !input.routeLabel ||
    !input.busType ||
    Number.isNaN(price) ||
    price <= 0 ||
    Number.isNaN(availableSeats) ||
    availableSeats <= 0
  ) {
    return null;
  }

  return {
    departureTerminalId: input.departureTerminalId,
    destinationTerminalId: input.destinationTerminalId,
    routeLabel: input.routeLabel,
    departureTime: input.departureTime,
    arrivalTime: input.arrivalTime,
    price,
    availableSeats,
    busType: input.busType,
    busLayoutId: input.busLayoutId ?? null,
    isActive: input.isActive ?? true,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const trip = await getDbTripById(tripId);

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json(trip);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const tripInput = validateTrip((await req.json()) as Partial<Trip>);
    if (!tripInput) {
      return NextResponse.json({ error: "Invalid trip details" }, { status: 400 });
    }

    const { tripId } = await params;
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: tripInput,
    });

    return NextResponse.json(formatTrip(trip));
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const { tripId } = await params;
    await prisma.trip.delete({ where: { id: tripId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
