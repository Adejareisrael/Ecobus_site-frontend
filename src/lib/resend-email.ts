import QRCode from "qrcode";
import { formatNaira, getDiscountedTotal } from "./utils";

type TicketEmailBooking = {
  id: string;
  reference: string;
  routeLabel: string;
  travelDate: string;
  departureTime: string;
  price: number;
  discountAmount?: number | null;
  seatsJson: string;
  passengerName: string;
};

type SendTicketEmailInput = {
  booking: TicketEmailBooking;
  recipient: string;
  subject: string;
  message: string;
  ticketUrl: string;
};

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTicketEmailHtml(input: SendTicketEmailInput) {
  const seats = JSON.parse(input.booking.seatsJson) as string[];
  const total = getDiscountedTotal(
    input.booking.price * seats.length,
    input.booking.discountAmount
  );

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#2563eb;color:#ffffff;padding:24px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;">Ecobus ticket</p>
          <h1 style="margin:8px 0 0;font-size:26px;">Booking confirmed</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">Hello ${escapeHtml(input.booking.passengerName)}, your Ecobus trip is confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
            <tr><td style="padding:8px 0;color:#64748b;">Reference</td><td style="padding:8px 0;text-align:right;font-weight:700;">${escapeHtml(input.booking.reference)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;text-align:right;">${escapeHtml(input.booking.routeLabel)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;text-align:right;">${escapeHtml(input.booking.travelDate)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;text-align:right;">${escapeHtml(input.booking.departureTime)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Seat(s)</td><td style="padding:8px 0;text-align:right;">${escapeHtml(seats.join(", "))}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;">${formatNaira(total)}</td></tr>
          </table>
          <p style="margin:0 0 14px;">Use the button below to open your ticket and QR code.</p>
          <a href="${escapeHtml(input.ticketUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Open ticket</a>
          <p style="margin:18px 0 0;color:#64748b;font-size:13px;">A QR code image is also attached to this email for check-in.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendTicketEmail(input: SendTicketEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      sent: false,
      skipped: true,
      error: "Resend is not configured. Add RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  const qrDataUrl = await QRCode.toDataURL(input.ticketUrl, {
    margin: 1,
    width: 320,
  });
  const qrContent = qrDataUrl.split(",")[1];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.recipient,
      subject: input.subject,
      text: input.message,
      html: buildTicketEmailHtml(input),
      attachments: [
        {
          filename: `ecobus-ticket-${input.booking.reference}.png`,
          content: qrContent,
        },
      ],
    }),
  });

  const data = (await res.json().catch(() => ({}))) as ResendResponse;
  if (!res.ok) {
    return {
      sent: false,
      skipped: false,
      error: data.message || data.name || "Resend email failed.",
    };
  }

  return {
    sent: true,
    skipped: false,
    providerId: data.id,
  };
}
