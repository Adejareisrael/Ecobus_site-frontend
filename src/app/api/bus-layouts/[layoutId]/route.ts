import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  busLayoutToDbInput,
  formatBusLayout,
  validateLayoutSeats,
} from "@/lib/bus-layouts";
import { BusLayout } from "@/lib/types";

function validateLayout(input: Partial<BusLayout>) {
  if (!input.name || !input.model || !Array.isArray(input.seats)) return null;

  const seats = validateLayoutSeats(input.seats);
  if (seats.length === 0) return null;

  return busLayoutToDbInput({
    name: input.name.trim(),
    model: input.model.trim(),
    totalSeats: seats.length,
    seats,
    isDefault: Boolean(input.isDefault),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const input = validateLayout((await req.json()) as Partial<BusLayout>);
    if (!input) {
      return NextResponse.json({ error: "Invalid bus layout" }, { status: 400 });
    }

    const { layoutId } = await params;
    if (input.isDefault) {
      await prisma.busLayout.updateMany({
        where: { id: { not: layoutId } },
        data: { isDefault: false },
      });
    }

    const layout = await prisma.busLayout.update({
      where: { id: layoutId },
      data: input,
    });

    return NextResponse.json(formatBusLayout(layout));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const { layoutId } = await params;
    const attachedTrips = await prisma.trip.count({ where: { busLayoutId: layoutId } });

    if (attachedTrips > 0) {
      return NextResponse.json(
        { error: "This layout is assigned to trips and cannot be deleted" },
        { status: 409 }
      );
    }

    await prisma.busLayout.delete({ where: { id: layoutId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
