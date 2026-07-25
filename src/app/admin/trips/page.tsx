"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Pencil, Plus, Trash2, X } from "lucide-react";
import { BusLayout, Terminal, Trip } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatNaira, formatTime12h } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { positiveIntegerInput } from "@/lib/form-input";

type TripForm = {
  id: string;
  departureTerminalId: string;
  destinationTerminalId: string;
  departureIsCustom: boolean;
  departureCustomName: string;
  destinationIsCustom: boolean;
  destinationCustomName: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: string;
  busType: Trip["busType"];
  busLayoutId: string;
  amenities: string;
};

const emptyForm: TripForm = {
  id: "",
  departureTerminalId: "",
  destinationTerminalId: "",
  departureIsCustom: false,
  departureCustomName: "",
  destinationIsCustom: false,
  destinationCustomName: "",
  departureTime: "07:00",
  arrivalTime: "11:30",
  price: "",
  availableSeats: "14",
  busType: "Toyota",
  busLayoutId: "toyota-14",
  amenities: "AC, USB charging, Luggage space",
};

// Locations that aren't a registered Terminal are stored on the trip as a
// self-describing id (no separate table), so trips can be created for
// one-off pickup/drop-off points without first creating a Terminal record.
const CUSTOM_LOCATION_PREFIX = "custom:";

function isCustomLocationId(id: string) {
  return id.startsWith(CUSTOM_LOCATION_PREFIX);
}

function encodeCustomLocation(name: string) {
  return `${CUSTOM_LOCATION_PREFIX}${encodeURIComponent(name.trim())}`;
}

function decodeCustomLocation(id: string) {
  return decodeURIComponent(id.slice(CUSTOM_LOCATION_PREFIX.length));
}

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

  const locationName = (id: string) => {
    if (isCustomLocationId(id)) return decodeCustomLocation(id);
    return terminalNameById.get(id) ?? id;
  };

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
    const departureIsCustom = isCustomLocationId(trip.departureTerminalId);
    const destinationIsCustom = isCustomLocationId(trip.destinationTerminalId);

    setForm({
      id: trip.id,
      departureTerminalId: departureIsCustom ? "" : trip.departureTerminalId,
      destinationTerminalId: destinationIsCustom ? "" : trip.destinationTerminalId,
      departureIsCustom,
      departureCustomName: departureIsCustom
        ? decodeCustomLocation(trip.departureTerminalId)
        : "",
      destinationIsCustom,
      destinationCustomName: destinationIsCustom
        ? decodeCustomLocation(trip.destinationTerminalId)
        : "",
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      price: String(trip.price),
      availableSeats: String(trip.availableSeats),
      busType: trip.busType,
      busLayoutId: trip.busLayoutId ?? "",
      amenities: (trip.amenities ?? []).join(", "),
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
    return `${locationName(fromId)} -> ${locationName(toId)}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const price = Number(form.price);
    const availableSeats =
      form.busType === "Toyota" ? 14 : Number(form.availableSeats);

    const departureTerminalId = form.departureIsCustom
      ? encodeCustomLocation(form.departureCustomName)
      : form.departureTerminalId;
    const destinationTerminalId = form.destinationIsCustom
      ? encodeCustomLocation(form.destinationCustomName)
      : form.destinationTerminalId;

    if (
      (form.departureIsCustom ? !form.departureCustomName.trim() : !form.departureTerminalId) ||
      (form.destinationIsCustom ? !form.destinationCustomName.trim() : !form.destinationTerminalId) ||
      departureTerminalId === destinationTerminalId ||
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
      departureTerminalId,
      destinationTerminalId,
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
      price,
      availableSeats,
      busType: form.busType,
      busLayoutId: form.busLayoutId || null,
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      routeLabel: routeLabel(departureTerminalId, destinationTerminalId),
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
              <div className="grid gap-1 text-xs font-medium text-slate-500">
                <div className="flex items-center justify-between">
                  <span>From</span>
                  <button
                    type="button"
                    className="font-medium text-ecobus-red hover:underline"
                    onClick={() =>
                      updateForm({
                        departureIsCustom: !form.departureIsCustom,
                        departureTerminalId: "",
                        departureCustomName: "",
                      })
                    }
                  >
                    {form.departureIsCustom ? "Choose terminal instead" : "Use custom location"}
                  </button>
                </div>
                {form.departureIsCustom ? (
                  <Input
                    placeholder="e.g. Ijebu-Ode Park"
                    value={form.departureCustomName}
                    onChange={(event) =>
                      updateForm({ departureCustomName: event.target.value })
                    }
                    required
                  />
                ) : (
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
                )}
              </div>

              <div className="grid gap-1 text-xs font-medium text-slate-500">
                <div className="flex items-center justify-between">
                  <span>To</span>
                  <button
                    type="button"
                    className="font-medium text-ecobus-red hover:underline"
                    onClick={() =>
                      updateForm({
                        destinationIsCustom: !form.destinationIsCustom,
                        destinationTerminalId: "",
                        destinationCustomName: "",
                      })
                    }
                  >
                    {form.destinationIsCustom ? "Choose terminal instead" : "Use custom location"}
                  </button>
                </div>
                {form.destinationIsCustom ? (
                  <Input
                    placeholder="e.g. Ijebu-Ode Park"
                    value={form.destinationCustomName}
                    onChange={(event) =>
                      updateForm({ destinationCustomName: event.target.value })
                    }
                    required
                  />
                ) : (
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
                )}
              </div>

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
                Estimated arrival time
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
                  step="1"
                  value={form.price}
                  onChange={(event) =>
                    updateForm({ price: positiveIntegerInput(event.target.value) })
                  }
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
                  step="1"
                  value={form.availableSeats}
                  onChange={(event) =>
                    updateForm({ availableSeats: positiveIntegerInput(event.target.value) })
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

              <label className="grid gap-1 text-xs font-medium text-slate-500 xl:col-span-2">
                Amenities
                <Input
                  value={form.amenities}
                  onChange={(event) =>
                    updateForm({ amenities: event.target.value })
                  }
                  placeholder="AC, USB charging, Luggage space"
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
                  {formatTime12h(trip.departureTime)} {"->"} {formatTime12h(trip.arrivalTime)}
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

            {trip.amenities && trip.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trip.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}

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
