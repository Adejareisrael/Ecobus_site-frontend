import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatTrip, getDbTrips } from "@/lib/server-data";
import { Trip } from "@/lib/types";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

function validateTrip(input: Partial<Trip>) {
  if (
    !input.departureTerminalId ||
    !input.destinationTerminalId ||
    input.departureTerminalId === input.destinationTerminalId ||
    !input.departureTime ||
    !input.arrivalTime ||
    !input.routeLabel ||
    !input.busType ||
    !input.price ||
    !input.availableSeats
  ) {
    return null;
  }

  const price = Number(input.price);
  const availableSeats =
    input.busType === "Toyota" ? 14 : Number(input.availableSeats);

  if (
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
    amenitiesJson: JSON.stringify(input.amenities ?? []),
    isActive: input.isActive ?? true,
  };
}

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const includeInactive = searchParams.get("includeInactive") === "true";

  if (includeInactive) {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;
  }

  const trips = await getDbTrips({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    includeInactive,
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const tripInput = validateTrip((await req.json()) as Partial<Trip>);
    if (!tripInput) {
      return NextResponse.json({ error: "Invalid trip details" }, { status: 400 });
    }

    const trip = await prisma.trip.create({ data: tripInput });
    return NextResponse.json(formatTrip(trip), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
