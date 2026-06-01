import { NextRequest, NextResponse } from "next/server";
import { getDbTripById } from "@/lib/server-data";
import { getDbSeatsForTrip } from "@/lib/seat-availability";
import { normalizeTravelDate } from "@/lib/travel-date";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const travelDate = normalizeTravelDate(req.nextUrl.searchParams.get("date"));
  const trip = await getDbTripById(tripId);

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const seats = await getDbSeatsForTrip(trip, travelDate);
  return NextResponse.json(seats);
}
