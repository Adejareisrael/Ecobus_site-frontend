import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin, requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function formatRequest(request: {
  id: string;
  bookingId: string;
  requestType: string;
  preferredDate: string | null;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  booking?: { reference: string } | null;
}) {
  return {
    id: request.id,
    bookingId: request.bookingId,
    reference: request.booking?.reference,
    requestType: request.requestType,
    preferredDate: request.preferredDate,
    reason: request.reason,
    status: request.status,
    adminNote: request.adminNote,
    createdAt: request.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const requests = await prisma.bookingChangeRequest.findMany({
    include: { booking: { select: { reference: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(requests.map(formatRequest));
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (isAuthResponse(auth)) return auth;

    const input = (await req.json()) as {
      bookingId?: string;
      requestType?: string;
      preferredDate?: string;
      reason?: string;
    };

    const requestType = input.requestType;
    if (
      !input.bookingId ||
      !requestType ||
      !["Reschedule", "Cancel"].includes(requestType) ||
      !input.reason?.trim()
    ) {
      return NextResponse.json({ error: "Invalid request details" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking || (booking.userId && booking.userId !== auth.userId)) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const request = await prisma.bookingChangeRequest.create({
      data: {
        bookingId: booking.id,
        userId: auth.userId,
        requestType,
        preferredDate: requestType === "Reschedule" ? input.preferredDate || null : null,
        reason: input.reason.trim(),
      },
      include: { booking: { select: { reference: true } } },
    });

    return NextResponse.json(formatRequest(request), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit request" }, { status: 500 });
  }
}
