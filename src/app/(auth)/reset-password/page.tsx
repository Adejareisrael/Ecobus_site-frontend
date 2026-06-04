"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!token || !password || password !== confirmPassword) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Could not reset password.");
        return;
      }

      setMessage(
        (data as { message?: string }).message ??
          "Password updated. You can now log in."
      );
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = Boolean(token && password && confirmPassword && !mismatch);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create new password</h1>
        <p className="text-sm text-slate-500">
          Use at least 8 characters with letters and numbers.
        </p>
      </div>

      {!token && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-500">
          This reset link is missing a token. Request a new password reset link.
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

      <div className="space-y-3">
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      {mismatch && (
        <p className="text-sm text-red-500">Passwords do not match.</p>
      )}

      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
      >
        {loading ? "Updating..." : "Update password"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Ready to sign in?{" "}
        <Link href="/login" className="font-medium text-ecobus-purple">
          Back to login
        </Link>
      </p>
    </div>
  );
}
