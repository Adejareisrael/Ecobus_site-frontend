"use client";

import { FormEvent, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { Terminal } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth-store";

type TerminalForm = {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  hours: string;
  mapUrl: string;
  facilities: string;
};

const emptyForm: TerminalForm = {
  id: "",
  name: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  hours: "",
  mapUrl: "",
  facilities: "",
};

export default function AdminTerminalsPage() {
  const token = useAuthStore((s) => s.token);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [form, setForm] = useState<TerminalForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTerminals() {
      const res = await fetch("/api/terminals", { cache: "no-store" });
      if (res.ok) setTerminals((await res.json()) as Terminal[]);
      setLoading(false);
    }

    void loadTerminals();
  }, []);

  const updateForm = (updates: Partial<TerminalForm>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
    setMessage("");
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
    setMessage("");
  };

  const openEditForm = (terminal: Terminal) => {
    setForm({
      id: terminal.id,
      name: terminal.name,
      city: terminal.city,
      state: terminal.state,
      address: terminal.address ?? "",
      phone: terminal.phone ?? "",
      hours: terminal.hours ?? "",
      mapUrl: terminal.mapUrl ?? "",
      facilities: (terminal.facilities ?? []).join(", "),
    });
    setEditingId(terminal.id);
    setIsFormOpen(true);
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const payload = {
      id: form.id,
      name: form.name,
      city: form.city,
      state: form.state,
      address: form.address,
      phone: form.phone,
      hours: form.hours,
      mapUrl: form.mapUrl,
      facilities: form.facilities
        .split(",")
        .map((facility) => facility.trim())
        .filter(Boolean),
    };

    const res = await fetch(
      editingId ? `/api/terminals/${editingId}` : "/api/terminals",
      {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      setMessage((data as { error?: string }).error ?? "Could not save terminal.");
      return;
    }

    const savedTerminal = data as Terminal;
    setTerminals((current) => {
      if (!editingId) return [...current, savedTerminal].sort(sortTerminals);
      return current.map((terminal) =>
        terminal.id === editingId ? savedTerminal : terminal
      );
    });
    window.dispatchEvent(new Event("ecobus:terminals-updated"));
    resetForm();
  };

  const deleteTerminal = async (terminalId: string) => {
    if (!token) return;
    setMessage("");

    const res = await fetch(`/api/terminals/${terminalId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage((data as { error?: string }).error ?? "Could not delete terminal.");
      return;
    }

    setTerminals((current) =>
      current.filter((terminal) => terminal.id !== terminalId)
    );
    window.dispatchEvent(new Event("ecobus:terminals-updated"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Terminals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage pickup and destination terminals used by trips.
          </p>
        </div>

        <Button className="gap-2" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          New terminal
        </Button>
      </div>

      {message && (
        <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {message}
        </Card>
      )}

      {isFormOpen && (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit terminal" : "Create terminal"}
                </h2>
                <p className="text-sm text-slate-500">
                  Terminal IDs cannot be changed after creation.
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
                ID
                <Input
                  value={form.id}
                  disabled={Boolean(editingId)}
                  onChange={(event) => updateForm({ id: event.target.value })}
                  placeholder="lagos-fadeyi"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Terminal name
                <Input
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  placeholder="Fadeyi Terminal"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                City
                <Input
                  value={form.city}
                  onChange={(event) => updateForm({ city: event.target.value })}
                  placeholder="Lagos"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                State
                <Input
                  value={form.state}
                  onChange={(event) => updateForm({ state: event.target.value })}
                  placeholder="Lagos"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500 xl:col-span-2">
                Address
                <Input
                  value={form.address}
                  onChange={(event) => updateForm({ address: event.target.value })}
                  placeholder="Fadeyi, Ikorodu Road"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Phone
                <Input
                  value={form.phone}
                  onChange={(event) => updateForm({ phone: event.target.value })}
                  placeholder="+234 913 399 4004"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Hours
                <Input
                  value={form.hours}
                  onChange={(event) => updateForm({ hours: event.target.value })}
                  placeholder="6:00 AM - 6:00 PM"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500 xl:col-span-2">
                Map URL
                <Input
                  value={form.mapUrl}
                  onChange={(event) => updateForm({ mapUrl: event.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500 xl:col-span-2">
                Facilities
                <Input
                  value={form.facilities}
                  onChange={(event) => updateForm({ facilities: event.target.value })}
                  placeholder="Waiting area, Ticket support, Boarding support"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Save changes" : "Create terminal"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-slate-500">Loading terminals...</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <Card key={terminal.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold">{terminal.name}</p>
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {terminal.city}, {terminal.state}
                  </p>
                </div>
              </div>

              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {terminal.id}
              </p>

              <p className="text-sm text-slate-500">
                {terminal.address || "No address yet"}
              </p>

              {terminal.facilities && terminal.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {terminal.facilities.slice(0, 3).map((facility) => (
                    <span key={facility} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      {facility}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full gap-2 text-xs"
                  onClick={() => openEditForm(terminal)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs text-red-500"
                  onClick={() => deleteTerminal(terminal.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function sortTerminals(a: Terminal, b: Terminal) {
  return `${a.city} ${a.name}`.localeCompare(`${b.city} ${b.name}`);
}
