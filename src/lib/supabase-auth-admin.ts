import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  SUPABASE_AUTH_PUBLISHABLE_KEY,
  SUPABASE_AUTH_URL,
} from "@/lib/supabase-auth-config";

let serverClient: SupabaseClient | null = null;

export class SupabaseAuthVerificationError extends Error {}

function getSupabaseAuthServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  serverClient = createClient(SUPABASE_AUTH_URL, SUPABASE_AUTH_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serverClient;
}

export type SupabaseGoogleIdentity = {
  uid: string;
  email: string;
  name: string | null;
};

function getDisplayName(user: User): string | null {
  const candidates = [user.user_metadata.full_name, user.user_metadata.name];
  const name = candidates.find((value) => typeof value === "string" && value.trim());
  return typeof name === "string" ? name.trim().slice(0, 120) : null;
}

export async function verifySupabaseGoogleToken(
  accessToken: string
): Promise<SupabaseGoogleIdentity> {
  const { data, error } = await getSupabaseAuthServerClient().auth.getUser(accessToken);
  const user = data.user;

  if (error || !user?.email) {
    throw new SupabaseAuthVerificationError("Invalid or expired Supabase access token");
  }

  if (!user.email_confirmed_at) {
    throw new SupabaseAuthVerificationError("Supabase account email is not verified");
  }

  const providers = new Set([
    ...(user.identities?.map((identity) => identity.provider) ?? []),
    ...(Array.isArray(user.app_metadata.providers) ? user.app_metadata.providers : []),
    typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : "",
  ]);
  if (!providers.has("google")) {
    throw new SupabaseAuthVerificationError(
      "The Supabase account was not authenticated by Google"
    );
  }

  return {
    uid: user.id,
    email: user.email.trim().toLowerCase(),
    name: getDisplayName(user),
  };
}
