"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmUrl, setConfirmUrl] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");
    setError("");
    setConfirmUrl("");

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Could not submit request.");
        return;
      }

      setMessage(
        (data as { message?: string }).message ??
          "If an account exists, a confirmation link will be sent."
      );
      setConfirmUrl((data as { confirmUrl?: string }).confirmUrl ?? "");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Delete your account</h1>
        <p className="text-sm text-slate-500">
          Enter the email on your Ecobus account. We&apos;ll email you a link to
          confirm permanent deletion of your account and personal data.
        </p>
      </div>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
        This cannot be undone. Bookings tied to your account are kept for
        records but are no longer linked to you.
      </p>

      {message && (
        <div className="space-y-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-600">
          <p>{message}</p>
          {confirmUrl && (
            <Link href={confirmUrl} className="block font-medium underline">
              Open local confirmation link
            </Link>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-500">
          {error}
        </p>
      )}

      <Input
        type="email"
        autoComplete="email"
        placeholder="Email address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleSubmit}
        disabled={!email.trim() || loading}
      >
        {loading ? "Submitting..." : "Send deletion link"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Changed your mind?{" "}
        <Link href="/login" className="font-medium text-ecobus-purple">
          Back to login
        </Link>
      </p>
    </div>
  );
}
