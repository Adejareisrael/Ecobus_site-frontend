"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Armchair, Copy, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { BusLayout, Seat } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth-store";

type LayoutForm = {
  id: string;
  name: string;
  model: string;
  rows: string;
  columns: string;
  seats: Seat[];
  isDefault: boolean;
};

const emptyForm: LayoutForm = {
  id: "",
  name: "",
  model: "",
  rows: "5",
  columns: "4",
  seats: [],
  isDefault: false,
};

function seatId(label: string) {
  return `seat-${label.trim()}`;
}

function seatKey(row: number, column: number) {
  return `${row}-${column}`;
}

function maxSeatPosition(seats: Seat[]) {
  return {
    rows: Math.max(1, ...seats.map((seat) => seat.row + 1)),
    columns: Math.max(1, ...seats.map((seat) => seat.column + 1)),
  };
}

export default function AdminBusLayoutsPage() {
  const token = useAuthStore((state) => state.token);
  const [layouts, setLayouts] = useState<BusLayout[]>([]);
  const [form, setForm] = useState<LayoutForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rows = Math.max(1, Number(form.rows) || 1);
  const columns = Math.max(1, Number(form.columns) || 1);

  const seatByPosition = useMemo(() => {
    return new Map(form.seats.map((seat) => [seatKey(seat.row, seat.column), seat]));
  }, [form.seats]);

  useEffect(() => {
    if (!token) return;

    async function loadLayouts() {
      const res = await fetch("/api/bus-layouts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) setLayouts((await res.json()) as BusLayout[]);
      setLoading(false);
    }

    void loadLayouts();
  }, [token]);

  const updateForm = (updates: Partial<LayoutForm>) => {
    setForm((current) => ({ ...current, ...updates }));
    setError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
    setError("");
  };

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (layout: BusLayout) => {
    const size = maxSeatPosition(layout.seats);
    setForm({
      id: layout.id,
      name: layout.name,
      model: layout.model,
      rows: String(size.rows),
      columns: String(size.columns),
      seats: layout.seats,
      isDefault: layout.isDefault,
    });
    setEditingId(layout.id);
    setIsFormOpen(true);
    setError("");
  };

  const duplicateLayout = (layout: BusLayout) => {
    const size = maxSeatPosition(layout.seats);
    setForm({
      id: "",
      name: `${layout.name} Copy`,
      model: layout.model,
      rows: String(size.rows),
      columns: String(size.columns),
      seats: layout.seats.map((seat) => ({ ...seat })),
      isDefault: false,
    });
    setEditingId(null);
    setIsFormOpen(true);
    setError("");
  };

  const toggleSeat = (row: number, column: number) => {
    const key = seatKey(row, column);
    const existing = seatByPosition.get(key);

    if (existing) {
      updateForm({
        seats: form.seats.filter((seat) => seat.id !== existing.id),
      });
      return;
    }

    const nextNumber = form.seats.length + 1;
    updateForm({
      seats: [
        ...form.seats,
        {
          id: seatId(String(nextNumber)),
          label: String(nextNumber),
          row,
          column,
          isAvailable: true,
        },
      ],
    });
  };

  const updateSeatLabel = (seatIdValue: string, label: string) => {
    updateForm({
      seats: form.seats.map((seat) =>
        seat.id === seatIdValue
          ? { ...seat, id: seatId(label || seat.label), label }
          : seat
      ),
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const labels = form.seats.map((seat) => seat.label.trim()).filter(Boolean);
    if (!form.name.trim() || !form.model.trim() || labels.length === 0) {
      setError("Add a name, model, and at least one seat.");
      return;
    }

    if (new Set(labels).size !== labels.length) {
      setError("Seat labels must be unique.");
      return;
    }

    const payload: BusLayout = {
      id: editingId ?? "",
      name: form.name,
      model: form.model,
      totalSeats: form.seats.length,
      seats: form.seats.map((seat) => ({
        ...seat,
        id: seatId(seat.label),
        label: seat.label.trim(),
        isAvailable: true,
      })),
      isDefault: form.isDefault,
    };

    const res = await fetch(
      editingId ? `/api/bus-layouts/${editingId}` : "/api/bus-layouts",
      {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to save layout.");
      return;
    }

    const savedLayout = (await res.json()) as BusLayout;
    setLayouts((current) => {
      const next = editingId
        ? current.map((layout) => (layout.id === editingId ? savedLayout : layout))
        : [savedLayout, ...current];

      return savedLayout.isDefault
        ? next.map((layout) => ({
            ...layout,
            isDefault: layout.id === savedLayout.id,
          }))
        : next;
    });
    resetForm();
  };

  const deleteLayout = async (layout: BusLayout) => {
    if (!token) return;

    const res = await fetch(`/api/bus-layouts/${layout.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to delete layout.");
      return;
    }

    setLayouts((current) => current.filter((item) => item.id !== layout.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Bus layouts</h1>
          <p className="mt-1 text-sm text-slate-500 lg:text-base">
            Manage bus models and the seats customers can book.
          </p>
        </div>

        <Button className="gap-2" onClick={openNewForm}>
          <Plus className="h-4 w-4" />
          New layout
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {isFormOpen && (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit layout" : "Create layout"}
                </h2>
                <p className="text-sm text-slate-500">
                  Tap grid cells to add or remove bookable seats.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close form"
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="grid gap-1 text-xs font-medium text-slate-500 xl:col-span-2">
                Layout name
                <Input
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  placeholder="Toyota 14-seater"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Model
                <Input
                  value={form.model}
                  onChange={(event) => updateForm({ model: event.target.value })}
                  placeholder="Toyota"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Rows
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={form.rows}
                  onChange={(event) => updateForm({ rows: event.target.value })}
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Columns
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={form.columns}
                  onChange={(event) => updateForm({ columns: event.target.value })}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => updateForm({ isDefault: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-ecobus-red"
              />
              Use as default layout for new Toyota trips
            </label>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div
                className="grid w-fit gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(3rem, 3rem))` }}
              >
                {Array.from({ length: rows }).flatMap((_, row) =>
                  Array.from({ length: columns }).map((__, column) => {
                    const seat = seatByPosition.get(seatKey(row, column));

                    return (
                      <button
                        type="button"
                        key={`${row}-${column}`}
                        onClick={() => toggleSeat(row, column)}
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                          seat
                            ? "border-ecobus-red bg-white text-ecobus-red shadow-sm"
                            : "border-dashed border-slate-300 bg-white/60 text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {seat?.label ?? "+"}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {form.seats.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {form.seats
                  .slice()
                  .sort((a, b) => a.row - b.row || a.column - b.column)
                  .map((seat) => (
                    <label
                      key={`${seat.row}-${seat.column}`}
                      className="grid gap-1 text-xs font-medium text-slate-500"
                    >
                      Row {seat.row + 1}, column {seat.column + 1}
                      <Input
                        value={seat.label}
                        onChange={(event) =>
                          updateSeatLabel(seat.id, event.target.value)
                        }
                        className="px-3 py-2"
                      />
                    </label>
                  ))}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                {editingId ? "Save layout" : "Create layout"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-slate-500">Loading layouts...</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {layouts.map((layout) => (
            <Card key={layout.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Armchair className="h-4 w-4 text-ecobus-red" />
                    <h2 className="font-semibold">{layout.name}</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {layout.model} · {layout.totalSeats} bookable seats
                  </p>
                </div>

                {layout.isDefault && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-600">
                    Default
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {layout.seats
                  .slice()
                  .sort((a, b) => a.row - b.row || a.column - b.column)
                  .map((seat) => (
                    <span
                      key={`${layout.id}-${seat.label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    >
                      {seat.label}
                    </span>
                  ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="w-full gap-2 text-xs"
                  onClick={() => openEditForm(layout)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs"
                  onClick={() => duplicateLayout(layout)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs text-red-500"
                  onClick={() => deleteLayout(layout)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && layouts.length === 0 && (
        <Card className="p-10 text-center text-slate-500">
          No bus layouts yet. Create the first layout to assign it to trips.
        </Card>
      )}
    </div>
  );
}
