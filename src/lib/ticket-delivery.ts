import { prisma } from "./prisma";
import { formatNaira, getDiscountedTotal } from "./utils";

export type TicketDeliveryChannel = "email" | "whatsapp" | "sms";
export type TicketDeliveryStatus = "Pending" | "Sent" | "Failed" | "Skipped";

type BookingForDelivery = {
  id: string;
  reference: string;
  routeLabel: string;
  travelDate: string;
  departureTime: string;
  price: number;
  discountAmount?: number | null;
  seatsJson: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
};

export function buildTicketUrl(bookingId: string, origin?: string | null) {
  const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/confirmation/${bookingId}`;
}

export function buildTicketMessage(booking: BookingForDelivery, origin?: string | null) {
  const seats = JSON.parse(booking.seatsJson) as string[];
  const subtotal = booking.price * seats.length;
  const total = getDiscountedTotal(subtotal, booking.discountAmount);
  const ticketUrl = buildTicketUrl(booking.id, origin);

  return `Ecobus ticket ${booking.reference}
Passenger: ${booking.passengerName}
Route: ${booking.routeLabel}
Date: ${booking.travelDate}
Departure: ${booking.departureTime}
Seat(s): ${seats.join(", ")}
Total paid: ${formatNaira(total)}
Ticket: ${ticketUrl}`;
}

export async function enqueueTicketDeliveries(
  booking: BookingForDelivery,
  origin?: string | null
) {
  const message = buildTicketMessage(booking, origin);
  const deliveries = [
    {
      channel: "email" satisfies TicketDeliveryChannel,
      recipient: booking.passengerEmail,
      subject: `Ecobus ticket ${booking.reference}`,
      message,
    },
    {
      channel: "whatsapp" satisfies TicketDeliveryChannel,
      recipient: booking.passengerPhone,
      subject: null,
      message,
    },
    {
      channel: "sms" satisfies TicketDeliveryChannel,
      recipient: booking.passengerPhone,
      subject: null,
      message,
    },
  ].filter((delivery) => delivery.recipient?.trim());

  await prisma.$transaction(
    deliveries.map((delivery) =>
      prisma.ticketDelivery.create({
        data: {
          bookingId: booking.id,
          reference: booking.reference,
          channel: delivery.channel,
          recipient: delivery.recipient,
          subject: delivery.subject,
          message: delivery.message,
          status: "Pending",
        },
      })
    )
  );
}
