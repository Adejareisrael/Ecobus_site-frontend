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

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const layouts = await prisma.busLayout.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(layouts.map(formatBusLayout));
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const input = validateLayout((await req.json()) as Partial<BusLayout>);
    if (!input) {
      return NextResponse.json({ error: "Invalid bus layout" }, { status: 400 });
    }

    if (input.isDefault) {
      await prisma.busLayout.updateMany({ data: { isDefault: false } });
    }

    const layout = await prisma.busLayout.create({ data: input });
    return NextResponse.json(formatBusLayout(layout), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
