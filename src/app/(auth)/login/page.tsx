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
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // 🔐 VALIDATION
  const validate = () => {
    const newErrors: typeof errors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = "Password must include letters and numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await new Promise((res) => setTimeout(res, 800));

      const role = email.toLowerCase().includes("admin")
        ? "admin"
        : "customer";

const user: User = {
  id: crypto.randomUUID(),
  name: email.split("@")[0],
  email,
  role,
};

login(user);

      // 💾 SESSION UX (remember me)
      if (rememberMe) {
        localStorage.setItem("ecobus-user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("ecobus-user", JSON.stringify(user));
      }

      login(user);

      router.push(role === "admin" ? "/admin" : "/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !email || !password || loading;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-slate-500">
          Sign in to continue your Ecobus journey
        </p>
      </div>

      {/* EMAIL */}
      <div className="space-y-1">
        <Input
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="space-y-1 relative">

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
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        {errors.password && (
          <p className="text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* REMEMBER ME */}
      <div className="flex items-center justify-between text-sm">

        <label className="flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        <Link
          href="#"
          className="text-ecobus-purple font-medium"
        >
          Forgot password?
        </Link>

      </div>

      {/* BUTTON */}
      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleLogin}
        disabled={isDisabled}
      >
        {loading ? "Signing in..." : "Login"}
      </Button>

      {/* SIGNUP */}
      <p className="text-sm text-center text-slate-500">
        Don’t have an account?{" "}
        <Link href="/signup" className="text-ecobus-purple font-medium">
          Sign up
        </Link>
      </p>

    </div>
  );
}