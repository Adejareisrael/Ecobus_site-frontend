"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { BookingChangeRequest } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

const statuses: BookingChangeRequest["status"][] = ["Pending", "Approved", "Rejected"];

export default function AdminChangeRequestsPage() {
  const token = useAuthStore((state) => state.token);
  const [requests, setRequests] = useState<BookingChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/booking-change-requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRequests(res.ok ? ((await res.json()) as BookingChangeRequest[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadRequests();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateStatus = async (requestId: string, status: BookingChangeRequest["status"]) => {
    if (!token) return;
    const res = await fetch(`/api/booking-change-requests/${requestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) return;
    const updated = (await res.json()) as BookingChangeRequest;
    setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Reschedule and cancellation requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review customer booking change requests.</p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={loadRequests} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="p-6 text-slate-500">Loading requests...</Card>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">No requests yet.</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.requestType}</p>
                  <p className="text-sm text-slate-500">Ref: {request.reference ?? request.bookingId}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {request.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Preferred date" value={request.preferredDate || "N/A"} />
                <Info label="Submitted" value={new Date(request.createdAt).toLocaleString()} />
              </div>

              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{request.reason}</p>

              <label className="mt-4 grid gap-1 text-xs font-medium text-slate-500">
                Status
                <Select value={request.status} onChange={(event) => updateStatus(request.id, event.target.value as BookingChangeRequest["status"])}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </label>
            </Card>
          ))}
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
