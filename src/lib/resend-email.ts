import QRCode from "qrcode";
import { formatNaira, formatTime12h, getDiscountedTotal } from "./utils";

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
          <h1 style="margin:8px 0 0;font-size:26px;">Reservation held</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">Hello ${escapeHtml(input.booking.passengerName)}, your Ecobus seat is reserved. Pay the amount due in cash when you check in at the terminal.</p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
            <tr><td style="padding:8px 0;color:#64748b;">Reference</td><td style="padding:8px 0;text-align:right;font-weight:700;">${escapeHtml(input.booking.reference)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;text-align:right;">${escapeHtml(input.booking.routeLabel)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;text-align:right;">${escapeHtml(input.booking.travelDate)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;text-align:right;">${escapeHtml(formatTime12h(input.booking.departureTime))}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Seat(s)</td><td style="padding:8px 0;text-align:right;">${escapeHtml(seats.join(", "))}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Amount due</td><td style="padding:8px 0;text-align:right;font-weight:700;">${formatNaira(total)}</td></tr>
          </table>
          <p style="margin:0 0 14px;">Use the button below to open your ticket and QR code.</p>
          <a href="${escapeHtml(input.ticketUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Open ticket</a>
          <p style="margin:18px 0 0;color:#64748b;font-size:13px;">A QR code image is also attached to this email for check-in and payment at the terminal.</p>
        </div>
      </div>
    </div>
  `;
}

type SendAccountDeletionEmailInput = {
  recipient: string;
  confirmUrl: string;
};

function buildAccountDeletionEmailHtml(input: SendAccountDeletionEmailInput) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#d82027;color:#ffffff;padding:24px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;">Ecobus account</p>
          <h1 style="margin:8px 0 0;font-size:26px;">Confirm account deletion</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">We received a request to permanently delete your Ecobus account. If this was you, confirm below. This link expires in 1 hour.</p>
          <a href="${escapeHtml(input.confirmUrl)}" style="display:inline-block;background:#d82027;color:#ffffff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Confirm deletion</a>
          <p style="margin:18px 0 0;color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email — your account will not be affected.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendAccountDeletionEmail(input: SendAccountDeletionEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      sent: false,
      skipped: true,
      error: "Resend is not configured. Add RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.recipient,
      subject: "Confirm your Ecobus account deletion",
      text: `Confirm your Ecobus account deletion by opening this link (expires in 1 hour): ${input.confirmUrl}\n\nIf you didn't request this, you can ignore this email.`,
      html: buildAccountDeletionEmailHtml(input),
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

type SendPasswordResetEmailInput = {
  recipient: string;
  resetUrl: string;
};

function buildPasswordResetEmailHtml(input: SendPasswordResetEmailInput) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#0f4f8a;color:#ffffff;padding:24px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;">Ecobus account</p>
          <h1 style="margin:8px 0 0;font-size:26px;">Reset your password</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">We received a request to reset your Ecobus password. This link expires in 1 hour.</p>
          <a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#0f4f8a;color:#ffffff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Reset password</a>
          <p style="margin:18px 0 0;color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      sent: false,
      skipped: true,
      error: "Resend is not configured. Add RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.recipient,
      subject: "Reset your Ecobus password",
      text: `Reset your Ecobus password by opening this link (expires in 1 hour): ${input.resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
      html: buildPasswordResetEmailHtml(input),
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

type SendCharterRequestNotificationInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  pickup: string;
  destination: string;
  travelDate: string;
  returnDate?: string | null;
  passengers: number;
  vehicleType?: string | null;
  notes?: string | null;
};

function buildCharterRequestNotificationHtml(input: SendCharterRequestNotificationInput) {
  const rows: [string, string][] = [
    ["Full name", input.fullName],
    ["Phone", input.phone],
    ["Email", input.email || "—"],
    ["Pickup", input.pickup],
    ["Destination", input.destination],
    ["Travel date", input.travelDate],
    ["Return date", input.returnDate || "—"],
    ["Number of buses", String(input.passengers)],
    ["Vehicle type", input.vehicleType || "—"],
    ["Notes", input.notes || "—"],
  ];

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#7c3aed;color:#ffffff;padding:24px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;">Ecobus vehicle hire</p>
          <h1 style="margin:8px 0 0;font-size:26px;">New charter request</h1>
        </div>
        <div style="padding:24px;">
          <table style="width:100%;border-collapse:collapse;">
            ${rows
              .map(
                ([label, value]) =>
                  `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;font-weight:600;">${escapeHtml(value)}</td></tr>`
              )
              .join("")}
          </table>
          <p style="margin:20px 0 0;color:#64748b;font-size:13px;">Review and respond to this request from the admin panel's Vehicle hire section.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendCharterRequestNotificationEmail(input: SendCharterRequestNotificationInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipient = process.env.SUPPORT_EMAIL;

  if (!apiKey || !from || !recipient) {
    return {
      sent: false,
      skipped: true,
      error: "Resend is not configured. Add RESEND_API_KEY, EMAIL_FROM, and SUPPORT_EMAIL.",
    };
  }

  const text = `New vehicle hire request:

Full name: ${input.fullName}
Phone: ${input.phone}
Email: ${input.email || "—"}
Pickup: ${input.pickup}
Destination: ${input.destination}
Travel date: ${input.travelDate}
Return date: ${input.returnDate || "—"}
Number of buses: ${input.passengers}
Vehicle type: ${input.vehicleType || "—"}
Notes: ${input.notes || "—"}

Review this in the admin panel's Vehicle hire section.`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipient,
      subject: `New vehicle hire request from ${input.fullName}`,
      text,
      html: buildCharterRequestNotificationHtml(input),
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
