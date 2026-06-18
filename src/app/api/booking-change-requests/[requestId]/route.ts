import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const { requestId } = await params;
    const { status, adminNote } = (await req.json()) as {
      status?: string;
      adminNote?: string;
    };

    if (!status || !["Pending", "Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request status" }, { status: 400 });
    }

    const request = await prisma.bookingChangeRequest.update({
      where: { id: requestId },
      data: { status, adminNote: adminNote?.trim() || null },
      include: { booking: { select: { reference: true } } },
    });

    return NextResponse.json({
      id: request.id,
      bookingId: request.bookingId,
      reference: request.booking.reference,
      requestType: request.requestType,
      preferredDate: request.preferredDate,
      reason: request.reason,
      status: request.status,
      adminNote: request.adminNote,
      createdAt: request.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Could not update request" }, { status: 500 });
  }
}
