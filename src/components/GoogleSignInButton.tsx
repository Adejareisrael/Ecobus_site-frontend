"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/store/auth-store";
import { signInWithGoogle } from "@/lib/firebase-client";

export function GoogleSignInButton({ onError }: { onError?: (message: string) => void }) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    onError?.("");

    try {
      const { idToken } = await signInWithGoogle();

      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        onError?.(data.error ?? "Google sign-in failed");
        return;
      }

      login(data.user as User, data.token as string);
      router.push((data.user as User).role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      // TEMPORARY diagnostic — remove once native Google sign-in is confirmed working.
      const detail = err instanceof Error ? err.message : JSON.stringify(err);
      onError?.(`DIAGNOSTIC: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full gap-2 border border-slate-200 dark:border-slate-700"
      onClick={handleClick}
      disabled={loading}
    >
      <GoogleIcon />
      {loading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.95 11.95 0 0 0 0 12c0 1.93.46 3.76 1.29 5.38z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}
