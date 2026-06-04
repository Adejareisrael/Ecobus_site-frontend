"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");
    setError("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
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
          "If an account exists, reset instructions will be sent."
      );
      setResetUrl((data as { resetUrl?: string }).resetUrl ?? "");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-slate-500">
          Enter the email on your Ecobus account.
        </p>
      </div>

      {message && (
        <div className="space-y-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-600">
          <p>{message}</p>
          {resetUrl && (
            <Link href={resetUrl} className="block font-medium underline">
              Open local reset link
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
        {loading ? "Submitting..." : "Send reset instructions"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ecobus-purple">
          Back to login
        </Link>
      </p>
    </div>
  );
}
