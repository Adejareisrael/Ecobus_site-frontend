"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { exchangeSupabaseCode } from "@/lib/supabase-auth-client";
import { useAuthStore } from "@/store/auth-store";

export function googleAuthErrorMessage(reason: unknown): string {
  const detail = reason instanceof Error ? reason.message.toLowerCase() : "";
  if (detail.includes("access_denied") || detail.includes("cancel")) {
    return "Google sign-in was cancelled. Please try again when you're ready.";
  }
  return "We couldn't complete Google sign-in. Please return to login and try again.";
}

export default function SupabaseAuthCallbackPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finishSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      hashParams.forEach((value, key) => {
        if (!params.has(key)) params.set(key, value);
      });

      const providerError = params.get("error_description") || params.get("error");
      if (providerError) throw new Error(providerError);

      const code = params.get("code");
      if (!code) throw new Error("The sign-in response did not include an authorization code");

      const result = await exchangeSupabaseCode(code);
      login(result.user, result.token);
      router.replace(result.user.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    };

    void finishSignIn().catch((reason: unknown) => setError(googleAuthErrorMessage(reason)));
  }, [login, router]);

  if (error) {
    return (
      <div className="space-y-5 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign-in failed</h1>
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-blue-700 px-5 text-sm font-semibold text-white"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-4 text-center" role="status">
      <LoaderCircle className="h-8 w-8 animate-spin text-blue-700" aria-hidden="true" />
      <div>
        <h1 className="font-semibold text-slate-900 dark:text-white">Completing sign-in</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Connecting your Google account to Ecobus...
        </p>
      </div>
    </div>
  );
}
