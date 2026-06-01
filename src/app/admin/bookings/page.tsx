"use client";

import { useEffect, useState } from "react";
import { Booking, BookingStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";
import { Select } from "@/components/ui/Select";
import { CheckCircle2, Mail, MessageCircle, Phone } from "lucide-react";

const bookingStatuses: BookingStatus[] = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Failed",
  "Refunded",
];

export default function AdminBookingsPage() {
  const token = useAuthStore((s) => s.token);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Booking[]) => setBookings(data))
      .finally(() => setLoading(false));
  }, [token]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-50 text-emerald-600";
      case "Pending":
        return "bg-yellow-50 text-yellow-600";
      case "Cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const updateBookingStatus = async (
    bookingId: string,
    status: BookingStatus
  ) => {
    if (!token) return;

    setUpdatingId(bookingId);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) return;

      const updatedBooking = (await res.json()) as Booking;
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
      setSelectedBooking((current) =>
        current?.id === bookingId ? updatedBooking : current
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const ticketMessage = selectedBooking
    ? `Ecobus ticket ${selectedBooking.reference}: ${selectedBooking.trip.routeLabel}, ${selectedBooking.travelDate} ${selectedBooking.trip.departureTime}, seat(s) ${selectedBooking.seats.join(", ")}. ${typeof window === "undefined" ? "" : `${window.location.origin}/confirmation/${selectedBooking.id}`}`
    : "";

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">
          Bookings
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          All customer bookings
        </p>
      </div>

      {/* GRID */}
      <div className="space-y-4">

        {loading ? (
          <p className="text-slate-500">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <Card className="p-10 text-center text-slate-500">
            No bookings yet.
          </Card>
        ) : (
          bookings.map((b) => (
            <Card
              key={b.id}
              className="p-5 hover:shadow-md transition"
            >

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                {/* LEFT */}
                <div className="space-y-1">

                  <p className="font-semibold">
                    {b.reference}
                  </p>

                  <p className="text-sm text-slate-500">
                    {b.trip.routeLabel}
                  </p>

                  <p className="text-sm">
                    Passenger: {b.passenger.fullName}
                  </p>

                  <p className="text-sm text-slate-600">
                    Date: {b.travelDate || "Not set"}
                  </p>

                  <p className="text-sm text-slate-600">
                    Seats: {b.seats.join(", ")}
                  </p>

                  <p className="text-sm text-slate-600">
                    Boarding: {b.checkedInAt ? "Checked in" : "Not checked in"}
                  </p>

                </div>

                {/* RIGHT */}
                <div className="text-left md:text-right space-y-2">

                  <p className="text-lg font-bold text-ecobus-red">
                    {formatNaira(
                      getBookingTotal(
                        b.trip.price,
                        b.seats.length
                      )
                    )}
                  </p>

                  {/* STATUS BADGE */}
                  <div className="grid gap-2 md:justify-items-end">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>

                    {b.checkedInAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Boarded
                      </span>
                    )}

                    <Select
                      className="h-10 min-w-36 py-2 text-xs"
                      value={b.status}
                      disabled={updatingId === b.id}
                      onChange={(event) =>
                        updateBookingStatus(
                          b.id,
                          event.target.value as BookingStatus
                        )
                      }
                    >
                      {bookingStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 md:justify-end pt-2">

                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => setSelectedBooking(b)}
                    >
                      View
                    </Button>

                    <Button
                      variant="ghost"
                      className="text-xs text-red-500"
                      disabled={updatingId === b.id || b.status === "Cancelled"}
                      onClick={() => updateBookingStatus(b.id, "Cancelled")}
                    >
                      Cancel
                    </Button>

                  </div>

                </div>

              </div>

            </Card>
          ))
        )}

      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <Card className="w-full max-w-lg p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedBooking.reference}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedBooking.trip.routeLabel}
                </p>
              </div>

              <Button variant="ghost" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Passenger</span>
                <strong>{selectedBooking.passenger.fullName}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Phone</span>
                <strong>{selectedBooking.passenger.phone}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Email</span>
                <strong>{selectedBooking.passenger.email || "Not provided"}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Travel date</span>
                <strong>{selectedBooking.travelDate || "Not set"}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Seats</span>
                <strong>{selectedBooking.seats.join(", ")}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Boarding</span>
                <strong>
                  {selectedBooking.checkedInAt
                    ? `Checked in at ${new Date(selectedBooking.checkedInAt).toLocaleString()}`
                    : "Not checked in"}
                </strong>
              </div>
              {selectedBooking.checkedInBy && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Checked in by</span>
                  <strong>{selectedBooking.checkedInBy}</strong>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Total</span>
                <strong className="text-ecobus-red">
                  {formatNaira(
                    getBookingTotal(
                      selectedBooking.trip.price,
                      selectedBooking.seats.length
                    )
                  )}
                </strong>
              </div>
            </div>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Booking status
              <Select
                value={selectedBooking.status}
                onChange={(event) =>
                  updateBookingStatus(
                    selectedBooking.id,
                    event.target.value as BookingStatus
                  )
                }
              >
                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              <a
                href={`mailto:${selectedBooking.passenger.email}?subject=${encodeURIComponent(`Ecobus ticket ${selectedBooking.reference}`)}&body=${encodeURIComponent(ticketMessage)}`}
              >
                <Button variant="secondary" className="w-full gap-2 text-xs">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </a>
              <a
                href={`https://wa.me/${selectedBooking.passenger.phone.replace(/\D/g, "")}?text=${encodeURIComponent(ticketMessage)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="secondary" className="w-full gap-2 text-xs">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
              <a href={`sms:${selectedBooking.passenger.phone}?&body=${encodeURIComponent(ticketMessage)}`}>
                <Button variant="secondary" className="w-full gap-2 text-xs">
                  <Phone className="h-4 w-4" />
                  SMS
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
