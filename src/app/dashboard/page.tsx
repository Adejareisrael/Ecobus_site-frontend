"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/Input";
import { phoneInput } from "@/lib/form-input";

export default function DashboardPage() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [changeRequest, setChangeRequest] = useState({
    bookingId: "",
    requestType: "Reschedule",
    preferredDate: "",
    reason: "",
  });
  const [changeMessage, setChangeMessage] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => {
      setProfile({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
      });
    });
  }, [user, router]);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Booking[]) => setBookings(data))
      .finally(() => setLoading(false));
  }, [token]);

  const totalBookings = bookings.length;
  const totalSpent = bookings.reduce(
    (acc, b) =>
      acc + getBookingTotal(b.trip.price, b.seats.length),
    0
  );

  const activeTrips = bookings.filter(
    (b) => b.status === "Confirmed"
  ).length;

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (!res.ok) {
        setProfileError((data as { error?: string }).error ?? "Could not save profile.");
        return;
      }

      const updated = data as {
        user: NonNullable<typeof user>;
        token: string;
      };
      login(updated.user, updated.token);
      setProfileMessage("Profile saved.");
    } catch {
      setProfileError("Something went wrong. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const submitChangeRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !changeRequest.bookingId) return;

    setChangeMessage("");
    const res = await fetch("/api/booking-change-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(changeRequest),
    });

    if (res.ok) {
      setChangeMessage("Request sent. Ecobus support will review it.");
      setChangeRequest({
        bookingId: "",
        requestType: "Reschedule",
        preferredDate: "",
        reason: "",
      });
    } else {
      const data = (await res.json()) as { error?: string };
      setChangeMessage(data.error ?? "Could not submit request.");
    }
  };

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          My Dashboard
        </h1>

        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Manage your bookings and travel history
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Bookings</p>
          <h2 className="text-2xl font-bold mt-1">
            {loading ? "..." : totalBookings}
          </h2>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Spent</p>
          <h2 className="text-2xl font-bold mt-1 text-ecobus-red">
            {loading ? "..." : formatNaira(totalSpent)}
          </h2>
        </Card>

        {/* Always visible now */}
        <Card className="p-5">
          <p className="text-sm text-slate-500">Active Trips</p>
          <h2 className="text-2xl font-bold mt-1 text-ecobus-purple">
            {loading ? "..." : activeTrips}
          </h2>
        </Card>

      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <p className="text-sm text-slate-500">
            Correct your account details if there was a mistake during signup.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Full name
            <Input
              value={profile.name}
              onChange={(event) =>
                setProfile((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </label>

          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Email
            <Input
              type="email"
              value={profile.email}
              onChange={(event) =>
                setProfile((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Phone
            <Input
              type="tel"
              inputMode="tel"
              value={profile.phone}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  phone: phoneInput(event.target.value),
                }))
              }
            />
          </label>

          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>

        {profileMessage && (
          <p className="mt-3 text-sm text-emerald-600">{profileMessage}</p>
        )}
        {profileError && (
          <p className="mt-3 text-sm text-red-600">{profileError}</p>
        )}
      </Card>

      {/* BOOKINGS LIST */}
      <div className="space-y-4">

        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
                <div className="h-3 w-60 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-48 bg-slate-200 rounded" />
              </Card>
            ))}
          </>
        ) : bookings.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <p className="text-slate-600 font-medium">
              No bookings yet
            </p>

            <p className="text-sm text-slate-500">
              Start your first journey with Ecobus 🚍
            </p>

            <Link href="/search">
              <Button className="bg-ecobus-red text-white mt-2">
                Book a trip
              </Button>
            </Link>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card
              key={booking.id}
              className="p-5 hover:shadow-md transition"
            >

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                {/* LEFT */}
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-semibold">
                    {booking.trip.routeLabel}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {booking.trip.departureTime} • {booking.trip.busType}
                  </p>

                  <p className="text-sm text-slate-600">
                    Passenger: {booking.passenger.fullName}
                  </p>

                  <p className="text-sm text-slate-600">
                    Seats: {booking.seats.join(", ")}
                  </p>
                </div>

                {/* RIGHT */}
                <div className="text-left md:text-right space-y-1">

                  <p className="text-lg font-bold text-ecobus-red">
                    {formatNaira(
                      getBookingTotal(
                        booking.trip.price,
                        booking.seats.length
                      )
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    Ref: {booking.reference}
                  </p>

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>

                </div>

              </div>

              {booking.status === "Confirmed" && (
                <div className="mt-4 border-t pt-4">
                  {changeRequest.bookingId === booking.id ? (
                    <form onSubmit={submitChangeRequest} className="grid gap-3 md:grid-cols-[160px_180px_1fr_auto]">
                      <select
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={changeRequest.requestType}
                        onChange={(event) =>
                          setChangeRequest((current) => ({
                            ...current,
                            requestType: event.target.value,
                          }))
                        }
                      >
                        <option value="Reschedule">Reschedule</option>
                        <option value="Cancel">Cancel</option>
                      </select>
                      {changeRequest.requestType === "Reschedule" ? (
                        <Input
                          type="date"
                          value={changeRequest.preferredDate}
                          onChange={(event) =>
                            setChangeRequest((current) => ({
                              ...current,
                              preferredDate: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <div className="hidden md:block" />
                      )}
                      <Input
                        placeholder="Reason"
                        value={changeRequest.reason}
                        onChange={(event) =>
                          setChangeRequest((current) => ({
                            ...current,
                            reason: event.target.value,
                          }))
                        }
                        required
                      />
                      <Button type="submit">Send request</Button>
                    </form>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setChangeRequest((current) => ({
                          ...current,
                          bookingId: booking.id,
                        }))
                      }
                    >
                      Reschedule or cancel
                    </Button>
                  )}
                </div>
              )}

            </Card>
          ))
        )}

      </div>

      {changeMessage && (
        <Card className="p-4 text-sm text-slate-600">{changeMessage}</Card>
      )}

    </div>
  );
}
