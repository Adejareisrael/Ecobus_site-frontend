import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-auth-client", () => ({
  exchangeSupabaseCode: vi.fn(),
}));

vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

describe("Google auth callback errors", () => {
  it("uses a clear message when the customer cancels Google sign-in", async () => {
    const { googleAuthErrorMessage } = await import("@/app/(auth)/auth/callback/page");

    expect(googleAuthErrorMessage(new Error("access_denied"))).toBe(
      "Google sign-in was cancelled. Please try again when you're ready."
    );
  });

  it("does not expose Supabase flow details to customers", async () => {
    const { googleAuthErrorMessage } = await import("@/app/(auth)/auth/callback/page");

    const message = googleAuthErrorMessage(
      new Error("invalid flow state, no valid flow state found")
    );
    expect(message).toBe(
      "We couldn't complete Google sign-in. Please return to login and try again."
    );
    expect(message).not.toContain("flow state");
  });
});
