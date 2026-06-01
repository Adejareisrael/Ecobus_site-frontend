import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    const [tripCount, bookingCount, terminalCount] = await Promise.all([
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.terminal.count(),
    ]);

    return NextResponse.json({
      ok: true,
      uptime: process.uptime(),
      latencyMs: Date.now() - startedAt,
      counts: {
        trips: tripCount,
        bookings: bookingCount,
        terminals: terminalCount,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
