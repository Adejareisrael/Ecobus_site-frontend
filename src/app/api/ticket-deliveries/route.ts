import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function formatDelivery(delivery: {
  id: string;
  bookingId: string;
  reference: string;
  channel: string;
  recipient: string;
  subject: string | null;
  message: string;
  status: string;
  lastError: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const status = req.nextUrl.searchParams.get("status")?.trim();
  const channel = req.nextUrl.searchParams.get("channel")?.trim();

  const deliveries = await prisma.ticketDelivery.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(channel && channel !== "all" ? { channel } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(deliveries.map(formatDelivery));
}
