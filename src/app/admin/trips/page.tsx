"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Pencil, Plus, Trash2, X } from "lucide-react";
import { BusLayout, Terminal, Trip } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatNaira } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type TripForm = {
  id: string;
  departureTerminalId: string;
  destinationTerminalId: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: string;
  busType: Trip["busType"];
  busLayoutId: string;
};

const emptyForm: TripForm = {
  id: "",
  departureTerminalId: "",
  destinationTerminalId: "",
  departureTime: "07:00",
  arrivalTime: "11:30",
  price: "",
  availableSeats: "14",
  busType: "Toyota",
  busLayoutId: "toyota-14",
};

export default function AdminTripsPage() {
  const token = useAuthStore((s) => s.token);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [busLayouts, setBusLayouts] = useState<BusLayout[]>([]);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function loadTripsAndTerminals() {
      const [tripsRes, terminalsRes, busLayoutsRes] = await Promise.all([
        fetch("/api/trips?includeInactive=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/terminals", { cache: "no-store" }),
        fetch("/api/bus-layouts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (tripsRes.ok) setTrips((await tripsRes.json()) as Trip[]);
      if (terminalsRes.ok) setTerminals((await terminalsRes.json()) as Terminal[]);
      if (busLayoutsRes.ok) {
        const layouts = (await busLayoutsRes.json()) as BusLayout[];
        setBusLayouts(layouts);
        const defaultLayout = layouts.find((layout) => layout.isDefault) ?? layouts[0];
        if (defaultLayout) {
          setForm((current) =>
            current.busLayoutId
              ? current
              : {
                  ...current,
                  busLayoutId: defaultLayout.id,
                  busType: defaultLayout.model as Trip["busType"],
                  availableSeats: String(defaultLayout.totalSeats),
                }
          );
        }
      }
      setLoading(false);
    }

    void loadTripsAndTerminals();
  }, [token]);

  useEffect(() => {
    const handleTerminalsUpdated = async () => {
      const res = await fetch("/api/terminals", { cache: "no-store" });
      if (res.ok) setTerminals((await res.json()) as Terminal[]);
    };

    window.addEventListener("ecobus:terminals-updated", handleTerminalsUpdated);
    return () =>
      window.removeEventListener("ecobus:terminals-updated", handleTerminalsUpdated);
  }, []);

  const terminalNameById = useMemo(() => {
    return new Map(
      terminals.map((terminal) => [
        terminal.id,
        `${terminal.city} ${terminal.name.replace(" Terminal", "")}`,
      ])
    );
  }, [terminals]);

  const destinations = terminals.filter(
    (terminal) => terminal.id !== form.departureTerminalId
  );

  const updateForm = (updates: Partial<TripForm>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openNewTripForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (trip: Trip) => {
    setForm({
      id: trip.id,
      departureTerminalId: trip.departureTerminalId,
      destinationTerminalId: trip.destinationTerminalId,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      price: String(trip.price),
      availableSeats: String(trip.availableSeats),
      busType: trip.busType,
      busLayoutId: trip.busLayoutId ?? "",
    });
    setEditingId(trip.id);
    setIsFormOpen(true);
  };

  const deleteTrip = async (tripId: string) => {
    if (!token) return;

    const res = await fetch(`/api/trips/${tripId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    setTrips((current) => current.filter((trip) => trip.id !== tripId));
    if (editingId === tripId) resetForm();
  };

  const routeLabel = (fromId: string, toId: string) => {
    const from = terminalNameById.get(fromId) ?? fromId;
    const to = terminalNameById.get(toId) ?? toId;
    return `${from} -> ${to}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const price = Number(form.price);
    const availableSeats =
      form.busType === "Toyota" ? 14 : Number(form.availableSeats);

    if (
      !form.departureTerminalId ||
      !form.destinationTerminalId ||
      !form.departureTime ||
      !form.arrivalTime ||
      Number.isNaN(price) ||
      price <= 0 ||
      Number.isNaN(availableSeats) ||
      availableSeats <= 0
    ) {
      return;
    }

    const trip: Trip = {
      id: editingId ?? `trip-${Date.now()}`,
      departureTerminalId: form.departureTerminalId,
      destinationTerminalId: form.destinationTerminalId,
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
      price,
      availableSeats,
      busType: form.busType,
      busLayoutId: form.busLayoutId || null,
      routeLabel: routeLabel(form.departureTerminalId, form.destinationTerminalId),
    };

    const res = await fetch(editingId ? `/api/trips/${editingId}` : "/api/trips", {
      method: editingId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(trip),
    });

    if (!res.ok) return;

    const savedTrip = (await res.json()) as Trip;

    setTrips((current) => {
      if (!editingId) return [savedTrip, ...current];
      return current.map((item) => (item.id === editingId ? savedTrip : item));
    });

    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Trips</h1>

          <p className="text-sm lg:text-base text-slate-500 mt-1">
            Manage routes and schedules
          </p>
        </div>

        <div className="flex gap-2">
          <Button className="gap-2" onClick={openNewTripForm}>
            <Plus className="h-4 w-4" />
            New trip
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit trip" : "Create trip"}
                </h2>
                <p className="text-sm text-slate-500">
                  Update route, schedule, fare, seats, and bus type.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1 text-xs font-medium text-slate-500">
                From
                <Select
                  value={form.departureTerminalId}
                  onChange={(event) =>
                    updateForm({
                      departureTerminalId: event.target.value,
                      destinationTerminalId:
                        event.target.value === form.destinationTerminalId
                          ? ""
                          : form.destinationTerminalId,
                    })
                  }
                  required
                >
                  <option value="">Select terminal</option>
                  {terminals.map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.city} - {terminal.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                To
                <Select
                  value={form.destinationTerminalId}
                  onChange={(event) =>
                    updateForm({ destinationTerminalId: event.target.value })
                  }
                  required
                >
                  <option value="">Select terminal</option>
                  {destinations.map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.city} - {terminal.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Departure
                <Input
                  type="time"
                  value={form.departureTime}
                  onChange={(event) =>
                    updateForm({ departureTime: event.target.value })
                  }
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Arrival
                <Input
                  type="time"
                  value={form.arrivalTime}
                  onChange={(event) =>
                    updateForm({ arrivalTime: event.target.value })
                  }
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Fare
                <Input
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={(event) => updateForm({ price: event.target.value })}
                  placeholder="15000"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Bus layout
                <Select
                  value={form.busLayoutId}
                  onChange={(event) => {
                    const layout = busLayouts.find(
                      (item) => item.id === event.target.value
                    );
                    updateForm({
                      busLayoutId: event.target.value,
                      busType: (layout?.model ?? form.busType) as Trip["busType"],
                      availableSeats: layout
                        ? String(layout.totalSeats)
                        : form.availableSeats,
                    });
                  }}
                >
                  <option value="">Generic layout</option>
                  {busLayouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name} ({layout.totalSeats} seats)
                    </option>
                  ))}
                </Select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Seats
                <Input
                  type="number"
                  min="1"
                  value={form.availableSeats}
                  onChange={(event) =>
                    updateForm({ availableSeats: event.target.value })
                  }
                  required
                  disabled={Boolean(form.busLayoutId)}
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Bus model
                <Input
                  value={form.busType}
                  onChange={(event) =>
                    updateForm({
                      busType: event.target.value as Trip["busType"],
                    })
                  }
                  disabled={Boolean(form.busLayoutId)}
                  required
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Save changes" : "Create trip"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-slate-500">Loading trips...</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
          <Card
            key={trip.id}
            className="p-5 space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-base">{trip.routeLabel}</p>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarClock className="h-4 w-4" />
                  {trip.departureTime} {"->"} {trip.arrivalTime}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-600">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Bus</p>
                <p className="font-medium">{trip.busType}</p>
              </div>
              <div>
                <p className="text-slate-500">Seats</p>
                <p className="font-medium">{trip.availableSeats}</p>
              </div>
            </div>

            <p className="text-lg font-bold text-ecobus-red">
              {formatNaira(trip.price)}
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                className="w-full gap-2 text-xs"
                onClick={() => openEditForm(trip)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>

              <Button
                variant="ghost"
                className="w-full gap-2 text-xs text-red-500"
                onClick={() => deleteTrip(trip.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && trips.length === 0 && (
        <Card className="p-10 text-center text-slate-500">
          No trips yet. Create a route to start scheduling buses.
        </Card>
      )}
    </div>
  );
}
