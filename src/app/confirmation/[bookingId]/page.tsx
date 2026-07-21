"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Share2 } from "lucide-react";
import { Booking } from "@/lib/types";
import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal, getDiscountedTotal } from "@/lib/utils";
import { cacheTicket, getCachedTicket } from "@/lib/offline-tickets";
import { shareTicket } from "@/lib/native-share";

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();

  const lastBooking = useBookingStore((s) => s.lastBooking);
  const resetFlow = useBookingStore((s) => s.resetFlow);
  const bookingId = params.bookingId;
  const storedBooking = lastBooking?.id === bookingId ? lastBooking : null;

  const [booking, setBooking] = useState<Booking | null>(storedBooking);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(!storedBooking);
  const [error, setError] = useState(false);
  const [fromOfflineCache, setFromOfflineCache] = useState(false);

  useEffect(() => {
    if (storedBooking) {
      return;
    }

    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json() as Promise<Booking>;
      })
      .then((data) => {
        setBooking(data);
        setFromOfflineCache(false);
      })
      .catch(() => {
        void getCachedTicket(bookingId).then((cached) => {
          if (cached) {
            setBooking(cached.booking);
            setQrCodeUrl(cached.qrCodeUrl);
            setFromOfflineCache(true);
          } else {
            setError(true);
          }
        });
      })
      .finally(() => setLoading(false));
  }, [bookingId, storedBooking]);

  const subtotal = useMemo(() => {
    if (!booking) return 0;
    return getBookingTotal(booking.trip.price, booking.seats.length);
  }, [booking]);

  const discountAmount = booking?.discountAmount ?? 0;
  const total = getDiscountedTotal(subtotal, discountAmount);

  const statusLabel = (status: string) => {
    if (status === "Pending") return "Pending – Pay at Terminal";
    if (status === "Confirmed") return "Confirmed – Paid";
    return status;
  };

  useEffect(() => {
    if (!booking || fromOfflineCache) return;

    const ticketUrl = `${window.location.origin}/confirmation/${booking.id}?ref=${encodeURIComponent(booking.reference)}`;
    QRCode.toDataURL(ticketUrl, { margin: 1, width: 220 })
      .then((dataUrl) => {
        setQrCodeUrl(dataUrl);
        void cacheTicket(booking, dataUrl);
      })
      .catch(() => setQrCodeUrl(""));
  }, [booking, fromOfflineCache]);

  const shareCurrentTicket = async () => {
    if (!booking) return;

    const ticketUrl = `${window.location.origin}/confirmation/${booking.id}?ref=${encodeURIComponent(booking.reference)}`;
    await shareTicket({
      title: `Ecobus ticket ${booking.reference}`,
      text: `Ecobus ticket ${booking.reference}\n${booking.trip.routeLabel}\n${booking.travelDate} · ${booking.trip.departureTime}\nSeat(s): ${booking.seats.join(", ")}`,
      url: ticketUrl,
    });
  };

  const downloadTicket = async () => {
    if (!booking || !qrCodeUrl) return;

    const NAVY = "#0f172a";
    const MUTED = "#64748b";
    const BORDER = "#e2e8f0";
    const PAGE_BG = "#eef2f7";
    const BLUE = "#0f4f8a";
    const BLUE_LIGHT = "#e0edfb";
    const RED = "#d82027";

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1440;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const roundRectPath = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
    };

    const fillRoundRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      fill: string,
      stroke?: string
    ) => {
      roundRectPath(x, y, width, height, radius);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const dashedLine = (x1: number, y: number, x2: number, color: string, width = 2, dash: [number, number] = [8, 8]) => {
      ctx.save();
      ctx.setLineDash(dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      ctx.restore();
    };

    const fitFontSize = (text: string, maxWidth: number, weight: number, start: number, min: number) => {
      let size = start;
      ctx.font = `${weight} ${size}px Arial`;
      while (ctx.measureText(text).width > maxWidth && size > min) {
        size -= 2;
        ctx.font = `${weight} ${size}px Arial`;
      }
      return size;
    };

    const statusColors = (status: string) => {
      if (status === "Confirmed") return { bg: "#d1fae5", fg: "#065f46", dot: "#059669" };
      if (status === "Pending") return { bg: "#fef3c7", fg: "#92400e", dot: "#d97706" };
      if (status === "Cancelled" || status === "Failed") return { bg: "#fee2e2", fg: "#991b1b", dot: "#dc2626" };
      if (status === "Refunded") return { bg: "#e0e7ff", fg: "#3730a3", dot: "#4f46e5" };
      return { bg: "#e2e8f0", fg: "#334155", dot: "#64748b" };
    };

    const drawFieldBadge = (
      icon: string,
      label: string,
      value: string,
      x: number,
      y: number,
      maxWidth: number
    ) => {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fillStyle = BLUE_LIGHT;
      ctx.fill();
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, x, y + 1);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      const textX = x + 36;
      ctx.fillStyle = MUTED;
      ctx.font = "700 15px Arial";
      ctx.fillText(label.toUpperCase(), textX, y - 8);

      const size = fitFontSize(value, maxWidth - 36, 700, 26, 18);
      ctx.fillStyle = NAVY;
      ctx.font = `700 ${size}px Arial`;
      ctx.fillText(value, textX, y + 22);
    };

    const qrImage = await loadImage(qrCodeUrl);

    // Page background
    ctx.fillStyle = PAGE_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cardX = 40;
    const cardY = 40;
    const cardW = 820;
    const cardH = 1360;
    const cardRight = cardX + cardW;
    const radius = 32;

    // Card shadow + base
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 20;
    fillRoundRect(cardX, cardY, cardW, cardH, radius, "#ffffff", BORDER);
    ctx.restore();

    // Header (clipped to the card so the gradient respects the rounded corners)
    ctx.save();
    roundRectPath(cardX, cardY, cardW, cardH, radius);
    ctx.clip();

    const headerH = 210;
    const gradient = ctx.createLinearGradient(cardX, cardY, cardRight, cardY + headerH);
    gradient.addColorStop(0, BLUE);
    gradient.addColorStop(1, "#15679f");
    ctx.fillStyle = gradient;
    ctx.fillRect(cardX, cardY, cardW, headerH);

    // Logo mark: two slanted red bars, echoing the site wordmark
    ctx.save();
    ctx.translate(cardX + 52, cardY + 58);
    ctx.rotate(-0.2);
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, 9, 34);
    ctx.fillRect(16, 0, 9, 34);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Arial";
    ctx.fillText("ECOBUS", cardX + 92, cardY + 84);

    ctx.globalAlpha = 0.8;
    ctx.font = "600 17px Arial";
    ctx.fillText("D I G I T A L   T I C K E T", cardX + 52, cardY + 132);
    ctx.globalAlpha = 1;

    ctx.font = "700 36px Arial";
    ctx.fillText(booking.reference, cardX + 52, cardY + 178);

    // Accent stripe
    ctx.fillStyle = RED;
    ctx.fillRect(cardX, cardY + headerH, cardW, 8);
    ctx.restore();

    // Route
    const routeY = cardY + headerH + 8 + 68;
    const [origin, destination] = booking.trip.routeLabel.includes("->")
      ? booking.trip.routeLabel.split("->").map((s) => s.trim())
      : [booking.trip.routeLabel, ""];

    ctx.fillStyle = NAVY;
    ctx.textAlign = "left";
    if (destination) {
      const availableEach = cardW / 2 - 90;
      ctx.font = `700 ${fitFontSize(origin, availableEach, 700, 32, 20)}px Arial`;
      ctx.fillText(origin, cardX + 48, routeY);
      ctx.textAlign = "right";
      ctx.font = `700 ${fitFontSize(destination, availableEach, 700, 32, 20)}px Arial`;
      ctx.fillText(destination, cardRight - 48, routeY);
      ctx.textAlign = "left";
    } else {
      ctx.textAlign = "center";
      ctx.font = `700 ${fitFontSize(origin, cardW - 96, 700, 32, 20)}px Arial`;
      ctx.fillText(origin, cardX + cardW / 2, routeY);
      ctx.textAlign = "left";
    }

    const lineY = routeY + 34;
    dashedLine(cardX + 48, lineY, cardRight - 48, BORDER, 3, [2, 10]);
    ctx.beginPath();
    ctx.arc(cardX + 48, lineY, 6, 0, Math.PI * 2);
    ctx.fillStyle = BLUE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cardRight - 48, lineY, 6, 0, Math.PI * 2);
    ctx.fillStyle = BLUE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cardX + cardW / 2, lineY, 10, 0, Math.PI * 2);
    ctx.fillStyle = RED;
    ctx.fill();

    ctx.fillStyle = MUTED;
    ctx.font = "500 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${booking.travelDate} · ${booking.trip.departureTime} departure`, cardX + cardW / 2, lineY + 44);
    ctx.textAlign = "left";

    // Passenger / trip info card
    const infoY = lineY + 80;
    const infoH = 260;
    fillRoundRect(cardX + 48, infoY, cardW - 96, infoH, 20, "#f8fafc", BORDER);

    const col1X = cardX + 48 + 58;
    const col2X = cardX + 48 + (cardW - 96) / 2 + 34;
    const colWidth = (cardW - 96) / 2 - 80;
    const row1Y = infoY + 78;
    const row2Y = infoY + 204;

    drawFieldBadge("👤", "Passenger", booking.passenger.fullName, col1X, row1Y, colWidth);
    drawFieldBadge("📞", "Phone", booking.passenger.phone, col2X, row1Y, colWidth);
    drawFieldBadge("📅", "Travel date", booking.travelDate, col1X, row2Y, colWidth);
    drawFieldBadge("🕐", "Departure", booking.trip.departureTime, col2X, row2Y, colWidth);

    // Perforation divider
    const perfY = infoY + infoH + 30;
    ctx.fillStyle = PAGE_BG;
    ctx.beginPath();
    ctx.arc(cardX, perfY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cardRight, perfY, 22, 0, Math.PI * 2);
    ctx.fill();
    dashedLine(cardX + 48, perfY, cardRight - 48, "#cbd5e1", 2, [10, 8]);

    // Stub: seat + status (left), amount due (right)
    const stubY = perfY + 56;
    ctx.fillStyle = MUTED;
    ctx.font = "700 15px Arial";
    ctx.textAlign = "left";
    ctx.fillText("SEAT(S)", cardX + 48, stubY - 34);
    ctx.fillStyle = NAVY;
    ctx.font = "700 34px Arial";
    ctx.fillText(booking.seats.join(", "), cardX + 48, stubY);

    const colors = statusColors(booking.status);
    const pillLabel = statusLabel(booking.status).toUpperCase();
    ctx.font = "700 15px Arial";
    const pillTextWidth = ctx.measureText(pillLabel).width;
    const pillPaddingX = 18;
    const pillW = pillTextWidth + pillPaddingX * 2 + 20;
    const pillH = 38;
    const pillY = stubY + 24;
    fillRoundRect(cardX + 48, pillY, pillW, pillH, pillH / 2, colors.bg);
    ctx.beginPath();
    ctx.arc(cardX + 48 + pillPaddingX + 5, pillY + pillH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = colors.dot;
    ctx.fill();
    ctx.fillStyle = colors.fg;
    ctx.font = "700 15px Arial";
    ctx.fillText(pillLabel, cardX + 48 + pillPaddingX + 18, pillY + pillH / 2 + 5);

    ctx.textAlign = "right";
    ctx.fillStyle = MUTED;
    ctx.font = "700 15px Arial";
    ctx.fillText("AMOUNT DUE", cardRight - 48, stubY - 34);
    ctx.fillStyle = RED;
    ctx.font = "800 46px Arial";
    ctx.fillText(formatNaira(total), cardRight - 48, stubY + 8);
    if (discountAmount > 0) {
      ctx.fillStyle = MUTED;
      ctx.font = "600 18px Arial";
      ctx.fillText(`Discount applied: -${formatNaira(discountAmount)}`, cardRight - 48, stubY + 38);
    }
    ctx.textAlign = "left";

    // QR block
    const qrBoxSize = 300;
    const qrBoxX = cardX + (cardW - qrBoxSize) / 2;
    const qrBoxY = stubY + 90;
    ctx.save();
    ctx.setLineDash([6, 6]);
    fillRoundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20, "#ffffff", BORDER);
    ctx.restore();
    ctx.drawImage(qrImage, qrBoxX + 20, qrBoxY + 20, qrBoxSize - 40, qrBoxSize - 40);

    ctx.fillStyle = MUTED;
    ctx.font = "500 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Scan at check-in to confirm this booking", cardX + cardW / 2, qrBoxY + qrBoxSize + 40);

    // Footer
    const footerRuleY = qrBoxY + qrBoxSize + 66;
    dashedLine(cardX + 48, footerRuleY, cardRight - 48, BORDER, 2, [4, 6]);
    ctx.fillStyle = MUTED;
    ctx.font = "500 17px Arial";
    ctx.fillText(`${booking.reference}  ·  ecobustransport.com`, cardX + cardW / 2, footerRuleY + 34);
    ctx.textAlign = "left";

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ecobus-${booking.reference}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6 text-slate-500">Loading your ticket...</Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6 text-red-500">Booking not found or expired.</Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:py-10 space-y-6">

      {/* SUCCESS BANNER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-sm text-emerald-600">
          {booking.status === "Confirmed" ? "✔ Checked In & Paid" : "✔ Reservation Held"}
        </div>

        {fromOfflineCache && (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1 text-sm text-amber-700">
            Showing a saved offline copy — reconnect to see the latest status
          </div>
        )}

        <h1 className="text-2xl lg:text-3xl font-bold text-ecobus-purple">
          Your Ecobus ticket is ready
        </h1>

        <p className="text-sm text-slate-600">
          Present this ticket at the terminal and pay the amount due before departure
        </p>
      </div>

      {/* TICKET CARD */}
      <Card className="p-0 overflow-hidden">

        {/* HEADER STRIP */}
        <div className="bg-ecobus-red text-white p-5 text-center">
          <p className="text-xs uppercase tracking-widest opacity-80">
            Ecobus Digital Ticket
          </p>
          <p className="font-bold text-lg tracking-widest">
            {booking.reference}
          </p>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-5">

          {/* ROUTE */}
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold">{booking.trip.routeLabel}</p>
            <p className="text-sm text-slate-500">
              Date: {booking.travelDate} · Departure: {booking.trip.departureTime}
            </p>
          </div>

          {/* DETAILS GRID */}
          <div className="grid gap-3 text-sm bg-slate-50 p-4 rounded-xl">
            <div className="flex justify-between">
              <span>Passenger</span>
              <strong>{booking.passenger.fullName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Travel date</span>
              <strong>{booking.travelDate}</strong>
            </div>
            <div className="flex justify-between">
              <span>Seats</span>
              <strong>{booking.seats.join(", ")}</strong>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <strong>{statusLabel(booking.status)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Amount due</span>
              <strong className="text-ecobus-red">{formatNaira(total)}</strong>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <strong>{formatNaira(discountAmount)}</strong>
              </div>
            )}
          </div>

          {booking.status === "Pending" && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Pay at the terminal — show this ticket to staff when you check in to confirm your
              seat and complete payment.
            </div>
          )}

          <div className="flex justify-center">
            {qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeUrl}
                alt={`QR code for ticket ${booking.reference}`}
                className="h-36 w-36 rounded-xl border border-slate-200 bg-white p-2"
              />
            ) : (
              <div className="h-36 w-36 rounded-xl border bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                QR CODE
              </div>
            )}
          </div>

        </div>
      </Card>

      {/* ACTIONS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button onClick={downloadTicket} className="w-full" disabled={!qrCodeUrl}>
          Download
        </Button>
        <Button variant="secondary" className="gap-2" onClick={shareCurrentTicket}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            resetFlow();
            router.push("/");
          }}
        >
          Home
        </Button>
      </div>

    </div>
  );
}
