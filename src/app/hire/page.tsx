"use client";

import { FormEvent, useMemo, useState } from "react";
import { BusFront, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { phoneInput, positiveIntegerInput } from "@/lib/form-input";

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  pickup: "",
  destination: "",
  travelDate: "",
  returnDate: "",
  passengers: "1",
  vehicleType: "Toyota AC bus",
  notes: "",
};

export default function HirePage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const updateForm = (updates: Partial<typeof emptyForm>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/charter-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Could not submit request.");
        return;
      }

      setForm(emptyForm);
      setMessage("Request received. Ecobus support will contact you with availability and pricing.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-5">
          <p className="text-sm font-medium text-ecobus-red">Vehicle hire</p>
          <h1 className="text-3xl font-bold lg:text-5xl">Hire an Ecobus for private movement</h1>
          <p className="text-slate-600">
            Request AC buses for corporate trips, schools, churches, weddings, events, or group travel.
            Our team will confirm vehicle availability, pricing, and pickup details.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <BusFront className="h-5 w-5 text-ecobus-red" />
              <p className="mt-2 text-sm font-medium">AC buses</p>
            </Card>
            <Card className="p-4">
              <Users className="h-5 w-5 text-ecobus-purple" />
              <p className="mt-2 text-sm font-medium">Groups</p>
            </Card>
            <Card className="p-4">
              <CalendarDays className="h-5 w-5 text-slate-700" />
              <p className="mt-2 text-sm font-medium">Scheduled</p>
            </Card>
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Request a quote</h2>
              <p className="text-sm text-slate-500">Payment is not required here.</p>
            </div>

            {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Full name" value={form.fullName} onChange={(e) => updateForm({ fullName: e.target.value })} required />
              <Input placeholder="Phone number" type="tel" value={form.phone} onChange={(e) => updateForm({ phone: phoneInput(e.target.value) })} required />
              <Input placeholder="Email address" type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} />
              <Input placeholder="Vehicle type" value={form.vehicleType} onChange={(e) => updateForm({ vehicleType: e.target.value })} />
              <Input placeholder="Pickup location" value={form.pickup} onChange={(e) => updateForm({ pickup: e.target.value })} required />
              <Input placeholder="Destination" value={form.destination} onChange={(e) => updateForm({ destination: e.target.value })} required />
              <Input type="date" min={minDate} value={form.travelDate} onChange={(e) => updateForm({ travelDate: e.target.value })} required />
              <Input type="date" min={form.travelDate || minDate} value={form.returnDate} onChange={(e) => updateForm({ returnDate: e.target.value })} />
              <Input type="number" min="1" value={form.passengers} onChange={(e) => updateForm({ passengers: positiveIntegerInput(e.target.value) })} required />
            </div>

            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-ecobus-red focus:ring-2 focus:ring-ecobus-light dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Notes, pickup time, luggage needs, event details..."
              value={form.notes}
              onChange={(event) => updateForm({ notes: event.target.value })}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit request"}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
