import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_AUTH_PUBLISHABLE_KEY,
  SUPABASE_AUTH_URL,
} from "@/lib/supabase-auth-config";

export const NATIVE_AUTH_CALLBACK = "com.ecobustransport.app://auth/callback";

let browserClient: SupabaseClient | null = null;

export function getSupabaseAuthBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(SUPABASE_AUTH_URL, SUPABASE_AUTH_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
    },
  });

  return browserClient;
}

export async function beginNativeGoogleSignIn(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Native Google sign-in can only run inside the Ecobus app");
  }

  const supabase = getSupabaseAuthBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: NATIVE_AUTH_CALLBACK,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Supabase did not return a Google sign-in URL");

  await Browser.open({ url: data.url, toolbarColor: "#173a8f" });
}

export type AppAuthResult = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: "admin" | "customer";
  };
};

export async function exchangeSupabaseCode(code: string): Promise<AppAuthResult> {
  const supabase = getSupabaseAuthBrowserClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.access_token) {
    throw error || new Error("Supabase did not return a valid session");
  }

  const response = await fetch("/api/auth/supabase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: data.session.access_token }),
  });
  const result = (await response.json()) as AppAuthResult & { error?: string };

  if (!response.ok) {
    throw new Error(result.error || "Google sign-in failed");
  }

  return result;
}
