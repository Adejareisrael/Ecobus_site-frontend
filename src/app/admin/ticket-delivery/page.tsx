"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Mail, MessageCircle, Phone, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/auth-store";

type Delivery = {
  id: string;
  bookingId: string;
  reference: string;
  channel: "email" | "whatsapp" | "sms";
  recipient: string;
  subject: string | null;
  message: string;
  status: "Pending" | "Sent" | "Failed" | "Skipped";
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
};

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Phone,
};

export default function AdminTicketDeliveryPage() {
  const token = useAuthStore((state) => state.token);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [channelFilter, setChannelFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", statusFilter);
    params.set("channel", channelFilter);
    return params.toString();
  }, [channelFilter, statusFilter]);

  const loadDeliveries = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`/api/ticket-deliveries?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeliveries(res.ok ? ((await res.json()) as Delivery[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) return;
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      const res = await fetch(`/api/ticket-deliveries?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cancelled) return;

      setDeliveries(res.ok ? ((await res.json()) as Delivery[]) : []);
      setLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [query, token]);

  const updateStatus = async (delivery: Delivery, status: Delivery["status"]) => {
    if (!token) return;
    setUpdatingId(delivery.id);
    setMessage("");

    const res = await fetch(`/api/ticket-deliveries/${delivery.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      const updated = (await res.json()) as Delivery;
      setDeliveries((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setMessage(`Delivery marked ${status.toLowerCase()}.`);
    } else {
      setMessage("Could not update delivery status.");
    }

    setUpdatingId(null);
  };

  const copyMessage = async (delivery: Delivery) => {
    const text = delivery.subject
      ? `${delivery.subject}\n\n${delivery.message}`
      : delivery.message;
    await navigator.clipboard.writeText(text);
    setMessage("Ticket message copied.");
  };

  const deliveryHref = (delivery: Delivery) => {
    if (delivery.channel === "email") {
      return `mailto:${delivery.recipient}?subject=${encodeURIComponent(
        delivery.subject ?? `Ecobus ticket ${delivery.reference}`
      )}&body=${encodeURIComponent(delivery.message)}`;
    }
    if (delivery.channel === "whatsapp") {
      return `https://wa.me/${delivery.recipient.replace(/\D/g, "")}?text=${encodeURIComponent(delivery.message)}`;
    }
    return `sms:${delivery.recipient}?&body=${encodeURIComponent(delivery.message)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Ticket delivery</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review booking ticket delivery status. Email sends automatically when Resend is configured.
          </p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={loadDeliveries} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-slate-500">
          Status
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
            <option value="Skipped">Skipped</option>
            <option value="all">All</option>
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-500">
          Channel
          <Select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
            <option value="all">All channels</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </Select>
        </label>
      </Card>

      {message && (
        <Card className="border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-slate-500">Loading ticket deliveries...</Card>
      ) : deliveries.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No ticket deliveries match this filter.
        </Card>
      ) : (
        <div className="grid gap-4">
          {deliveries.map((delivery) => {
            const Icon = channelIcons[delivery.channel];
            return (
              <Card key={delivery.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-600">
                        <Icon className="h-3.5 w-3.5" />
                        {delivery.channel}
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        {delivery.status}
                      </span>
                      <span className="text-sm font-semibold">{delivery.reference}</span>
                    </div>

                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <Info label="Recipient" value={delivery.recipient} />
                      <Info label="Created" value={new Date(delivery.createdAt).toLocaleString()} />
                      {delivery.sentAt && (
                        <Info label="Sent" value={new Date(delivery.sentAt).toLocaleString()} />
                      )}
                    </div>

                    {delivery.subject && (
                      <p className="text-sm font-medium">{delivery.subject}</p>
                    )}
                    <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      {delivery.message}
                    </pre>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
                    <a href={deliveryHref(delivery)} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="w-full gap-2">
                        <Icon className="h-4 w-4" />
                        Open
                      </Button>
                    </a>
                    <Button variant="ghost" className="gap-2" onClick={() => copyMessage(delivery)}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={updatingId === delivery.id}
                      onClick={() => updateStatus(delivery, "Sent")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark sent
                    </Button>
                    <Button
                      variant="ghost"
                      className="gap-2 text-red-500"
                      disabled={updatingId === delivery.id}
                      onClick={() => updateStatus(delivery, "Skipped")}
                    >
                      <XCircle className="h-4 w-4" />
                      Skip
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
