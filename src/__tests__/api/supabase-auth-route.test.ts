import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const upsertUser = vi.fn();
const verifySupabaseGoogleToken = vi.fn();
const signToken = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { upsert: upsertUser } },
}));

vi.mock("@/lib/supabase-auth-admin", () => ({
  verifySupabaseGoogleToken,
}));

vi.mock("@/lib/auth", () => ({ signToken }));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ limited: false })),
  getClientKey: vi.fn(() => "supabase-auth:test"),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(async () => "unusable-password-hash") },
}));

function request(body: unknown) {
  return new NextRequest("https://bookings.ecobustransport.com/api/auth/supabase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/supabase", () => {
  beforeEach(() => {
    upsertUser.mockReset();
    verifySupabaseGoogleToken.mockReset();
    signToken.mockReset();
  });

  it("rejects requests without a Supabase access token", async () => {
    const { POST } = await import("@/app/api/auth/supabase/route");
    const response = await POST(request({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Supabase access token is required",
    });
    expect(verifySupabaseGoogleToken).not.toHaveBeenCalled();
  });

  it("rejects tokens that Supabase cannot verify", async () => {
    verifySupabaseGoogleToken.mockRejectedValue(new Error("invalid token"));
    const { POST } = await import("@/app/api/auth/supabase/route");
    const response = await POST(request({ accessToken: "bad-token" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid or expired sign-in token",
    });
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("returns the normal Ecobus session and preserves an existing admin role", async () => {
    verifySupabaseGoogleToken.mockResolvedValue({
      uid: "supabase-user-1",
      email: "admin@ecobustransport.com",
      name: "Ecobus Admin",
    });
    upsertUser.mockResolvedValue({
      id: "user-1",
      name: "Ecobus Admin",
      email: "admin@ecobustransport.com",
      phone: "+2349133994004",
      role: "admin",
    });
    signToken.mockReturnValue("ecobus-jwt");

    const { POST } = await import("@/app/api/auth/supabase/route");
    const response = await POST(request({ accessToken: "valid-token" }));

    expect(response.status).toBe(200);
    expect(upsertUser).toHaveBeenCalledWith({
      where: { email: "admin@ecobustransport.com" },
      update: {},
      create: {
        name: "Ecobus Admin",
        email: "admin@ecobustransport.com",
        password: "unusable-password-hash",
      },
    });
    expect(signToken).toHaveBeenCalledWith({
      userId: "user-1",
      email: "admin@ecobustransport.com",
      role: "admin",
    });
    await expect(response.json()).resolves.toEqual({
      token: "ecobus-jwt",
      user: {
        id: "user-1",
        name: "Ecobus Admin",
        email: "admin@ecobustransport.com",
        phone: "+2349133994004",
        role: "admin",
      },
    });
  });
});
