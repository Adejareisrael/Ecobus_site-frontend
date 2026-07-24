"use client";

import { useEffect, useState } from "react";
import { BusFront, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { CharterRequest } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

const statuses: CharterRequest["status"][] = ["New", "Contacted", "Quoted", "Closed"];

export default function AdminCharterRequestsPage() {
  const token = useAuthStore((state) => state.token);
  const [requests, setRequests] = useState<CharterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/charter-requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRequests(res.ok ? ((await res.json()) as CharterRequest[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadRequests();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateStatus = async (id: string, status: CharterRequest["status"]) => {
    if (!token) return;
    setMessage("");
    const res = await fetch("/api/charter-requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      setMessage("Could not update request.");
      return;
    }

    const updated = (await res.json()) as CharterRequest;
    setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Vehicle hire requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Follow up private movement, group travel, and charter enquiries.
          </p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={loadRequests} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {message && <Card className="border-red-100 bg-red-50 p-4 text-sm text-red-600">{message}</Card>}

      {loading ? (
        <Card className="p-6 text-slate-500">Loading requests...</Card>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">No vehicle hire requests yet.</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.fullName}</p>
                  <p className="text-sm text-slate-500">{request.phone} {request.email ? `· ${request.email}` : ""}</p>
                </div>
                <BusFront className="h-5 w-5 text-ecobus-red" />
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Pickup" value={request.pickup} />
                <Info label="Destination" value={request.destination} />
                <Info label="Travel date" value={request.travelDate} />
                <Info label="Return date" value={request.returnDate || "One way"} />
                <Info label="Passengers" value={String(request.passengers)} />
                <Info label="Vehicle" value={request.vehicleType || "Not specified"} />
              </div>

              {request.notes && (
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{request.notes}</p>
              )}

              <label className="mt-4 grid gap-1 text-xs font-medium text-slate-500">
                Status
                <Select value={request.status} onChange={(event) => updateStatus(request.id, event.target.value as CharterRequest["status"])}>
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
