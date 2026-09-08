import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { getUser } })),
}));

describe("verifySupabaseGoogleToken", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_AUTH_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_AUTH_PUBLISHABLE_KEY", "sb_publishable_test");
    getUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a verified Google identity and normalizes its profile", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "supabase-user-1",
          email: "  ADA@Example.COM ",
          email_confirmed_at: "2026-09-08T00:00:00.000Z",
          identities: [{ provider: "google" }],
          app_metadata: { provider: "google", providers: ["google"] },
          user_metadata: { full_name: "  Ada Customer  " },
        },
      },
      error: null,
    });

    const { verifySupabaseGoogleToken } = await import("@/lib/supabase-auth-admin");
    await expect(verifySupabaseGoogleToken("access-token")).resolves.toEqual({
      uid: "supabase-user-1",
      email: "ada@example.com",
      name: "Ada Customer",
    });
  });

  it("rejects a session that was not authenticated with Google", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "supabase-user-2",
          email: "user@example.com",
          email_confirmed_at: "2026-09-08T00:00:00.000Z",
          identities: [{ provider: "email" }],
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
        },
      },
      error: null,
    });

    const { verifySupabaseGoogleToken } = await import("@/lib/supabase-auth-admin");
    await expect(verifySupabaseGoogleToken("access-token")).rejects.toThrow(
      "not authenticated by Google"
    );
  });
});
