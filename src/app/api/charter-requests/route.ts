import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function formatRequest(request: {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  pickup: string;
  destination: string;
  travelDate: string;
  returnDate: string | null;
  passengers: number;
  vehicleType: string | null;
  notes: string | null;
  status: string;
  adminNote: string | null;
  createdAt: Date;
}) {
  return {
    ...request,
    createdAt: request.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const requests = await prisma.charterRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(requests.map(formatRequest));
}

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as {
      fullName?: string;
      phone?: string;
      email?: string;
      pickup?: string;
      destination?: string;
      travelDate?: string;
      returnDate?: string;
      passengers?: number | string;
      vehicleType?: string;
      notes?: string;
    };

    const passengers = Number(input.passengers);
    if (
      !input.fullName?.trim() ||
      !input.phone?.trim() ||
      !input.pickup?.trim() ||
      !input.destination?.trim() ||
      !input.travelDate?.trim() ||
      Number.isNaN(passengers) ||
      passengers < 1
    ) {
      return NextResponse.json({ error: "Required details are missing" }, { status: 400 });
    }

    const request = await prisma.charterRequest.create({
      data: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        pickup: input.pickup.trim(),
        destination: input.destination.trim(),
        travelDate: input.travelDate,
        returnDate: input.returnDate?.trim() || null,
        passengers,
        vehicleType: input.vehicleType?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    return NextResponse.json(formatRequest(request), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit charter request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const { id, status, adminNote } = (await req.json()) as {
      id?: string;
      status?: string;
      adminNote?: string;
    };

    if (!id || !status || !["New", "Contacted", "Quoted", "Closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid charter status" }, { status: 400 });
    }

    const request = await prisma.charterRequest.update({
      where: { id },
      data: { status, adminNote: adminNote?.trim() || null },
    });

    return NextResponse.json(formatRequest(request));
  } catch {
    return NextResponse.json({ error: "Could not update charter request" }, { status: 500 });
  }
}
