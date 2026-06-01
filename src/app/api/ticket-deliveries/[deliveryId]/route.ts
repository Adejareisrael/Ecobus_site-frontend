import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const statuses = ["Pending", "Sent", "Failed", "Skipped"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const { deliveryId } = await params;
  const { status, lastError } = (await req.json()) as {
    status?: string;
    lastError?: string | null;
  };

  if (!status || !statuses.includes(status)) {
    return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
  }

  const delivery = await prisma.ticketDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      lastError: status === "Failed" ? lastError?.trim() || "Manual delivery failed" : null,
      sentAt: status === "Sent" ? new Date() : null,
    },
  });

  return NextResponse.json({
    id: delivery.id,
    bookingId: delivery.bookingId,
    reference: delivery.reference,
    channel: delivery.channel,
    recipient: delivery.recipient,
    subject: delivery.subject,
    message: delivery.message,
    status: delivery.status,
    lastError: delivery.lastError,
    sentAt: delivery.sentAt?.toISOString() ?? null,
    createdAt: delivery.createdAt.toISOString(),
    updatedAt: delivery.updatedAt.toISOString(),
  });
}
