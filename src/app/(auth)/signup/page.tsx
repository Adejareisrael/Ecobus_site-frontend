"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/store/auth-store";
import { phoneInput } from "@/lib/form-input";

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });

  const handleSignup = async () => {
    if (!form.fullName || !form.email || !form.password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }

      login(data.user as User, data.token as string);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-slate-500">
          Join Ecobus and start booking intercity trips in minutes
        </p>
      </div>

      {error && (
        <p className="text-sm text-center text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <Input
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <Input
          placeholder="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          placeholder="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: phoneInput(e.target.value) })}
        />
        <Input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>

      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleSignup}
        disabled={!form.fullName || !form.email || !form.password || loading}
      >
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-sm text-center text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-ecobus-purple font-medium">Login</Link>
      </p>

    </div>
  );
}
