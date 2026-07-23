"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";
import { Eye, EyeOff } from "lucide-react";
import type { User } from "@/store/auth-store";
import { phoneInput } from "@/lib/form-input";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });

  const handleSignup = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email || !form.password) return;
    setLoading(true);
    setError("");

    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="First name"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            placeholder="Last name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
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
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleSignup}
        disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email || !form.password || loading}
      >
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <GoogleSignInButton onError={setError} />

      <p className="text-sm text-center text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-ecobus-purple font-medium">Login</Link>
      </p>

    </div>
  );
}
