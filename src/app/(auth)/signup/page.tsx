"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSignup = async () => {
    if (!form.fullName || !form.email || !form.password) return;

    setLoading(true);

    // MOCK DELAY (simulate API)
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 800);
  };

  const isDisabled =
    !form.fullName || !form.email || !form.password || loading;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="space-y-2">

        <h1 className="text-2xl font-bold">
          Create your account
        </h1>

        <p className="text-sm text-slate-500">
          Join Ecobus and start booking intercity trips in minutes
        </p>

      </div>

      {/* FORM */}
      <div className="space-y-4">

        <Input
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) =>
            setForm({ ...form, fullName: e.target.value })
          }
        />

        <Input
          placeholder="Email address"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <Input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <Input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

      </div>

      {/* CTA */}
      <Button
        className="w-full bg-ecobus-red text-white"
        onClick={handleSignup}
        disabled={isDisabled}
      >
        {loading ? "Creating account..." : "Create account"}
      </Button>

      {/* LOGIN LINK */}
      <p className="text-sm text-center text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-ecobus-purple font-medium"
        >
          Login
        </Link>
      </p>

    </div>
  );
}