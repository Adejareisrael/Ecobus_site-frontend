"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PromoCode } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { positiveIntegerInput, uppercaseCodeInput } from "@/lib/form-input";

type PromoForm = {
  id: string;
  code: string;
  description: string;
  discountType: PromoCode["discountType"];
  discountValue: string;
  minSpend: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: PromoForm = {
  id: "",
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minSpend: "0",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function AdminPromoCodesPage() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const authError =
    hydrated && !token ? "Your admin session is not ready. Please log in again." : "";
  const isLoading = loading && !authError;

  useEffect(() => {
    if (!hydrated) return;
    if (!token) return;

    async function loadPromoCodes() {
      try {
        const res = await fetch("/api/promo-codes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? "Could not load promo codes.");
          return;
        }
        setPromoCodes((await res.json()) as PromoCode[]);
      } catch {
        setError("Could not load promo codes. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadPromoCodes();
  }, [hydrated, token]);

  const updateForm = (updates: Partial<PromoForm>) => {
    setForm((current) => ({ ...current, ...updates }));
    setError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
    setError("");
  };

  const openEditForm = (promo: PromoCode) => {
    setForm({
      id: promo.id,
      code: promo.code,
      description: promo.description ?? "",
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minSpend: String(promo.minSpend),
      maxUses: promo.maxUses ? String(promo.maxUses) : "",
      startsAt: dateInputValue(promo.startsAt),
      expiresAt: dateInputValue(promo.expiresAt),
      isActive: promo.isActive,
    });
    setEditingId(promo.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");

    const payload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minSpend: Number(form.minSpend || 0),
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
    };

    try {
      const res = await fetch(
        editingId ? `/api/promo-codes/${editingId}` : "/api/promo-codes",
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
        setError(data?.error ?? "Could not save promo code.");
        return;
      }

      const saved = (await res.json()) as PromoCode;
      setPromoCodes((current) =>
        editingId
          ? current.map((promo) => (promo.id === editingId ? saved : promo))
          : [saved, ...current]
      );
      resetForm();
    } catch {
      setError("Could not save promo code. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deletePromoCode = async (promo: PromoCode) => {
    if (!token) return;

    const res = await fetch(`/api/promo-codes/${promo.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setPromoCodes((current) => current.filter((item) => item.id !== promo.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Promo codes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create discounts customers can apply during checkout.
          </p>
        </div>

        <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New promo
        </Button>
      </div>

      {(error || authError) && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || authError}
        </div>
      )}

      {isFormOpen && (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit promo" : "Create promo"}
                </h2>
                <p className="text-sm text-slate-500">
                  Codes are case-insensitive and saved in uppercase.
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Code
                <Input
                  value={form.code}
                  onChange={(event) =>
                    updateForm({ code: uppercaseCodeInput(event.target.value) })
                  }
                  placeholder="ECO10"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Discount type
                <Select
                  value={form.discountType}
                  onChange={(event) =>
                    updateForm({ discountType: event.target.value as PromoCode["discountType"] })
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </Select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Discount value
                <Input
                  type="number"
                  min="1"
                  step="1"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={(event) =>
                    updateForm({ discountValue: positiveIntegerInput(event.target.value) })
                  }
                  placeholder={form.discountType === "percentage" ? "10" : "1000"}
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Minimum spend
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minSpend}
                  onChange={(event) =>
                    updateForm({ minSpend: positiveIntegerInput(event.target.value) })
                  }
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Usage limit
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxUses}
                  onChange={(event) =>
                    updateForm({ maxUses: positiveIntegerInput(event.target.value) })
                  }
                  placeholder="Unlimited"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Starts
                <Input
                  type="date"
                  value={form.startsAt}
                  onChange={(event) => updateForm({ startsAt: event.target.value })}
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Expires
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) => updateForm({ expiresAt: event.target.value })}
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-slate-500 md:col-span-2 xl:col-span-4">
                Description
                <Input
                  value={form.description}
                  onChange={(event) => updateForm({ description: event.target.value })}
                  placeholder="Launch promo"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateForm({ isActive: event.target.checked })}
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save promo"
                    : "Create promo"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-6 text-slate-500">Loading promo codes...</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {promoCodes.map((promo) => (
            <Card key={promo.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{promo.code}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {promo.discountType === "percentage"
                      ? `${promo.discountValue}% off`
                      : `${formatNaira(promo.discountValue)} off`}
                    {promo.minSpend > 0 ? ` · Min ${formatNaira(promo.minSpend)}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    promo.isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {promo.isActive ? "Active" : "Paused"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-500">
                <p>Used {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ""}</p>
                {promo.description && <p>{promo.description}</p>}
                {promo.expiresAt && <p>Expires {promo.expiresAt.slice(0, 10)}</p>}
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  className="w-full gap-2 text-xs"
                  onClick={() => openEditForm(promo)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs text-red-500"
                  onClick={() => deletePromoCode(promo)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && promoCodes.length === 0 && !authError && (
        <Card className="p-10 text-center text-slate-500">
          No promo codes yet. Create one to start offering discounts.
        </Card>
      )}
    </div>
  );
}
