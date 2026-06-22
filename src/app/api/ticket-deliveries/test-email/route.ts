import { NextRequest, NextResponse } from "next/server";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";
import { buildTicketMessage, buildTicketUrl } from "@/lib/ticket-delivery";
import { sendTicketEmail } from "@/lib/resend-email";
import { prisma } from "@/lib/prisma";

type TestEmailBody = {
  recipient?: string;
};

const testBooking = {
  id: "test-ticket-email",
  reference: "ECO-TEST",
  routeLabel: "Lagos (Fadeyi) -> Benin",
  travelDate: new Date().toISOString().slice(0, 10),
  departureTime: "08:00 AM",
  price: 0,
  discountAmount: 0,
  seatsJson: JSON.stringify(["T1"]),
  passengerName: "Ecobus Admin",
  passengerPhone: "+2349133994004",
  passengerEmail: "info@ecobustransport.com",
};

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAuthResponse(admin)) return admin;

  const body = ((await req.json().catch(() => ({}))) ?? {}) as TestEmailBody;
  const recipient =
    body.recipient?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    admin.email ||
    testBooking.passengerEmail;

  const origin = new URL(req.url).origin;
  const subject = "Ecobus test ticket email";
  const ticketUrl = buildTicketUrl(testBooking.id, origin);
  const message = `${buildTicketMessage(testBooking, origin)}

This is an admin test email. No customer booking was created.`;

  const result = await sendTicketEmail({
    booking: testBooking,
    recipient,
    subject,
    message,
    ticketUrl,
  });

  let deliveryLogError: string | null = null;
  try {
    await prisma.ticketDelivery.create({
      data: {
        bookingId: testBooking.id,
        reference: testBooking.reference,
        channel: "email",
        recipient,
        subject,
        message,
        status: result.sent ? "Sent" : result.skipped ? "Skipped" : "Failed",
        sentAt: result.sent ? new Date() : null,
        lastError: result.sent ? null : result.error ?? "Test email was not sent.",
      },
    });
  } catch (error) {
    deliveryLogError =
      error instanceof Error ? error.message : "Could not save test delivery log.";
  }

  return NextResponse.json({
    ok: result.sent,
    status: result.sent ? "Sent" : result.skipped ? "Skipped" : "Failed",
    recipient,
    providerId: result.providerId ?? null,
    error: result.error ?? null,
    deliveryLogError,
  });
}
