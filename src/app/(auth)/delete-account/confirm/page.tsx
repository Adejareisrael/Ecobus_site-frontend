"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function ConfirmDeleteAccountPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!token) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/delete-account/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Could not delete account.");
        return;
      }

      setMessage(
        (data as { message?: string }).message ??
          "Your account and personal data have been deleted."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Confirm account deletion</h1>
        <p className="text-sm text-slate-500">
          This permanently deletes your Ecobus account and personal data. This
          cannot be undone.
        </p>
      </div>

      {!token && !message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-500">
          This deletion link is missing a token. Request a new deletion link.
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-600">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-500">
          {error}
        </p>
      )}

      {!message && (
        <Button
          className="w-full bg-ecobus-red text-white"
          onClick={handleConfirm}
          disabled={!token || loading}
        >
          {loading ? "Deleting..." : "Permanently delete my account"}
        </Button>
      )}

      <p className="text-center text-sm text-slate-500">
        Changed your mind?{" "}
        <Link href="/login" className="font-medium text-ecobus-purple">
          Back to login
        </Link>
      </p>
    </div>
  );
}
