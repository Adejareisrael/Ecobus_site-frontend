"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";
import { Eye, EyeOff } from "lucide-react";
import type { User } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      login(data.user as User, data.token as string);
      router.push((data.user as User).role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to continue your Ecobus journey</p>
      </div>

      {error && (
        <p className="text-sm text-center text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Input
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-ecobus-purple">
          Forgot password?
        </Link>
      </div>

      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleLogin}
        disabled={!email || !password || loading}
      >
        {loading ? "Signing in..." : "Login"}
      </Button>

      <p className="text-sm text-center text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-ecobus-purple font-medium">Sign up</Link>
      </p>

    </div>
  );
}
