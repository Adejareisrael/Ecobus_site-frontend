import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPaystackStatus, verifyPaystackSignature } from "@/lib/payment";

type PaystackWebhookEvent = {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    paid_at?: string;
  };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaystackWebhookEvent;
  const reference = event.data?.reference;

  if (!reference) {
    return NextResponse.json({ ok: true });
  }

  const booking = await prisma.booking.findUnique({
    where: { paystackRef: reference },
  });

  if (!booking) {
    return NextResponse.json({ ok: true });
  }

  const paymentStatus = mapPaystackStatus(event.data.status);

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus,
      amountPaid: event.data.amount,
      currency: event.data.currency || booking.currency,
      paidAt:
        paymentStatus === "Paid"
          ? event.data.paid_at
            ? new Date(event.data.paid_at)
            : new Date()
          : booking.paidAt,
      status:
        paymentStatus === "Paid"
          ? "Confirmed"
          : paymentStatus === "Failed" || paymentStatus === "Abandoned"
            ? "Failed"
            : booking.status,
    },
  });

  return NextResponse.json({ ok: true });
}
