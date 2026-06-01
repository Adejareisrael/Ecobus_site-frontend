"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Booking } from "@/lib/types";
import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal, getDiscountedTotal } from "@/lib/utils";

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

  useEffect(() => {
    if (storedBooking) {
      return;
    }

    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json() as Promise<Booking>;
      })
      .then((data) => setBooking(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [bookingId, storedBooking]);

  const subtotal = useMemo(() => {
    if (!booking) return 0;
    return getBookingTotal(booking.trip.price, booking.seats.length);
  }, [booking]);

  const discountAmount = booking?.discountAmount ?? 0;
  const total = getDiscountedTotal(subtotal, discountAmount);

  useEffect(() => {
    if (!booking) return;

    const ticketUrl = `${window.location.origin}/confirmation/${booking.id}?ref=${encodeURIComponent(booking.reference)}`;
    QRCode.toDataURL(ticketUrl, { margin: 1, width: 220 })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(""));
  }, [booking]);

  const downloadTicket = async () => {
    if (!booking || !qrCodeUrl) return;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const drawRoundRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      fill: string,
      stroke?: string
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const drawLabelValue = (label: string, value: string, x: number, y: number) => {
      ctx.fillStyle = "#64748b";
      ctx.font = "500 24px Arial";
      ctx.fillText(label, x, y);
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 30px Arial";
      ctx.fillText(value, x, y + 42);
    };

    const qrImage = await loadImage(qrCodeUrl);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRoundRect(44, 44, 812, 1232, 28, "#ffffff", "#e2e8f0");

    ctx.fillStyle = "#0f4f8a";
    ctx.fillRect(44, 44, 812, 180);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 44px Arial";
    ctx.fillText("Ecobus Digital Ticket", 96, 122);
    ctx.font = "600 28px Arial";
    ctx.fillText(booking.reference, 96, 170);

    ctx.fillStyle = "#d82027";
    ctx.fillRect(44, 224, 812, 10);

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 38px Arial";
    ctx.fillText(booking.trip.routeLabel, 96, 318);

    drawRoundRect(96, 370, 708, 300, 18, "#f8fafc", "#e2e8f0");
    drawLabelValue("Passenger", booking.passenger.fullName, 132, 430);
    drawLabelValue("Phone", booking.passenger.phone, 484, 430);
    drawLabelValue("Travel date", booking.travelDate, 132, 552);
    drawLabelValue("Departure", booking.trip.departureTime, 484, 552);

    drawRoundRect(96, 710, 708, 220, 18, "#ffffff", "#e2e8f0");
    drawLabelValue("Seat(s)", booking.seats.join(", "), 132, 770);
    drawLabelValue("Status", booking.status, 484, 770);
    drawLabelValue("Total paid", formatNaira(total), 132, 884);
    if (discountAmount > 0) {
      drawLabelValue("Discount", formatNaira(discountAmount), 484, 884);
    }

    ctx.drawImage(qrImage, 315, 974, 270, 270);
    ctx.fillStyle = "#475569";
    ctx.font = "500 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Scan this QR code to confirm this booking", 450, 1266);
    ctx.textAlign = "start";

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
          ✔ Booking Confirmed
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-ecobus-purple">
          Your Ecobus ticket is ready
        </h1>

        <p className="text-sm text-slate-600">
          Present this ticket at the terminal before departure
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
              <span>Total Paid</span>
              <strong className="text-ecobus-red">{formatNaira(total)}</strong>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <strong>{formatNaira(discountAmount)}</strong>
              </div>
            )}
          </div>

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
      <div className="grid gap-3 sm:grid-cols-3">
        <Button onClick={downloadTicket} className="w-full" disabled={!qrCodeUrl}>
          Download
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
