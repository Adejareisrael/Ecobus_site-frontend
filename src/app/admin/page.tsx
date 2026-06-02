"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Calendar, RotateCcw, Save, Settings, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { Booking } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  defaultSiteSettings,
  SITE_SETTINGS_STORAGE_KEY,
  SiteSettings,
} from "@/lib/site-settings-storage";
import { useAuthStore } from "@/store/auth-store";
import { formatNaira, getBookingTotal } from "@/lib/utils";
import { phoneInput } from "@/lib/form-input";

export default function AdminPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [tripCount, setTripCount] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadAdminData() {
      const [settingsRes, tripsRes] = await Promise.all([
        fetch("/api/site-settings"),
        fetch("/api/trips?includeInactive=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (settingsRes.ok) setSettings((await settingsRes.json()) as SiteSettings);
      if (tripsRes.ok) setTripCount(((await tripsRes.json()) as unknown[]).length);
    }

    void loadAdminData();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Booking[]) => setBookings(data));
  }, [token]);

  const updateSettings = (updates: Partial<SiteSettings>) => {
    setSettings((current) => ({ ...current, ...updates }));
    setSaved(false);
    setSaveError("");
  };

  const updatePopularRoute = (index: number, value: string) => {
    updateSettings({
      popularRoutes: settings.popularRoutes.map((route, routeIndex) =>
        routeIndex === index ? value : route
      ),
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setSaveError("Your admin session is not ready. Please log in again.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setSaveError(data.error ?? "Could not save content.");
        return;
      }

      setSettings((await res.json()) as SiteSettings);
      window.dispatchEvent(new StorageEvent("storage", { key: SITE_SETTINGS_STORAGE_KEY }));
      router.refresh();
      setSaved(true);
    } catch {
      setSaveError("Could not save content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!token) return;

    const res = await fetch("/api/site-settings", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setSettings((await res.json()) as SiteSettings);
      window.dispatchEvent(new StorageEvent("storage", { key: SITE_SETTINGS_STORAGE_KEY }));
    } else {
      setSettings(defaultSiteSettings);
    }

    setSaved(false);
  };

  const totalRevenue = bookings.reduce(
    (sum, booking) =>
      booking.status === "Confirmed"
        ? sum + getBookingTotal(booking.trip.price, booking.seats.length)
        : sum,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Edit site content, trips, bookings, and support details.
          </p>
        </div>

        <Link href="/">
          <Button variant="ghost">Preview site</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Editable trips</p>
          <h2 className="text-2xl font-bold text-ecobus-red mt-1">
            {tripCount}
          </h2>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">Bookings</p>
          <h2 className="text-2xl font-bold mt-1">{bookings.length}</h2>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">Confirmed revenue</p>
          <h2 className="text-2xl font-bold text-ecobus-purple mt-1">
            {formatNaira(totalRevenue)}
          </h2>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">Homepage routes</p>
          <h2 className="text-2xl font-bold mt-1">
            {settings.popularRoutes.length}
          </h2>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/trips">
          <Card className="p-5 h-full transition hover:shadow-md">
            <Calendar className="h-5 w-5 text-ecobus-red" />
            <h2 className="mt-3 font-semibold">Routes and schedules</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add, edit, delete, and reset bus trips.
            </p>
          </Card>
        </Link>

        <Link href="/admin/bookings">
          <Card className="p-5 h-full transition hover:shadow-md">
            <Ticket className="h-5 w-5 text-ecobus-purple" />
            <h2 className="mt-3 font-semibold">Bookings</h2>
            <p className="mt-1 text-sm text-slate-500">
              View passengers and change booking statuses.
            </p>
          </Card>
        </Link>

        <Card className="p-5 h-full">
          <Settings className="h-5 w-5 text-slate-700" />
          <h2 className="mt-3 font-semibold">Site content</h2>
          <p className="mt-1 text-sm text-slate-500">
            Edit the homepage, footer, support text, and WhatsApp link below.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Site content editor</h2>
              <p className="text-sm text-slate-500">
                Changes are saved in the database and appear on the public site.
              </p>
            </div>

            {saved && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                Saved
              </span>
            )}
          </div>

          {saveError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {saveError}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Hero title
              <Input
                value={settings.heroTitlePrefix}
                onChange={(event) =>
                  updateSettings({ heroTitlePrefix: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Brand name
              <Input
                value={settings.heroBrand}
                onChange={(event) =>
                  updateSettings({ heroBrand: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500 md:col-span-2">
              Hero description
              <Input
                value={settings.heroDescription}
                onChange={(event) =>
                  updateSettings({ heroDescription: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Hero card label
              <Input
                value={settings.heroEyebrow}
                onChange={(event) =>
                  updateSettings({ heroEyebrow: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Hero card title
              <Input
                value={settings.heroCardTitle}
                onChange={(event) =>
                  updateSettings({ heroCardTitle: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500 md:col-span-2">
              Hero card description
              <Input
                value={settings.heroCardDescription}
                onChange={(event) =>
                  updateSettings({ heroCardDescription: event.target.value })
                }
              />
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Popular routes</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {settings.popularRoutes.map((route, index) => (
                <Input
                  key={index}
                  value={route}
                  onChange={(event) =>
                    updatePopularRoute(index, event.target.value)
                  }
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-slate-500 md:col-span-2">
              Footer description
              <Input
                value={settings.footerDescription}
                onChange={(event) =>
                  updateSettings({ footerDescription: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Support text
              <Input
                value={settings.supportText}
                onChange={(event) =>
                  updateSettings({ supportText: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              WhatsApp number
              <Input
                type="tel"
                inputMode="tel"
                value={settings.whatsappNumber}
                onChange={(event) =>
                  updateSettings({ whatsappNumber: phoneInput(event.target.value) })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              WhatsApp message
              <Input
                value={settings.whatsappMessage}
                onChange={(event) =>
                  updateSettings({ whatsappMessage: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Support email
              <Input
                type="email"
                value={settings.email}
                onChange={(event) =>
                  updateSettings({ email: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Facebook handle
              <Input
                value={settings.facebookHandle}
                onChange={(event) =>
                  updateSettings({ facebookHandle: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Instagram handle
              <Input
                value={settings.instagramHandle}
                onChange={(event) =>
                  updateSettings({ instagramHandle: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              X handle
              <Input
                value={settings.xHandle}
                onChange={(event) =>
                  updateSettings({ xHandle: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Facebook URL
              <Input
                type="url"
                value={settings.facebookUrl}
                onChange={(event) =>
                  updateSettings({ facebookUrl: event.target.value })
                }
                placeholder="https://facebook.com/Ecobus.ng"
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Instagram URL
              <Input
                type="url"
                value={settings.instagramUrl}
                onChange={(event) =>
                  updateSettings({ instagramUrl: event.target.value })
                }
                placeholder="https://instagram.com/Ecobus_transport"
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              X URL
              <Input
                type="url"
                value={settings.xUrl}
                onChange={(event) =>
                  updateSettings({ xUrl: event.target.value })
                }
                placeholder="https://x.com/Ecobustransport"
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Response time text
              <Input
                value={settings.responseTimeText}
                onChange={(event) =>
                  updateSettings({ responseTimeText: event.target.value })
                }
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-slate-500 md:col-span-2">
              Footer bottom note
              <Input
                value={settings.bottomNote}
                onChange={(event) =>
                  updateSettings({ bottomNote: event.target.value })
                }
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="gap-2"
              onClick={resetSettings}
            >
              <RotateCcw className="h-4 w-4" />
              Reset content
            </Button>

            <Button type="submit" className="gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved" : "Save content"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
