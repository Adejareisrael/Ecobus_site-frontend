import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";
import { hashResetToken } from "@/lib/password-reset";
import { NextRequest } from "next/server";
import { createUser, jsonRequest } from "../test-utils";

function r(path: string, body: unknown): NextRequest {
  return jsonRequest(path, "POST", body) as unknown as NextRequest;
}

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns token and user on valid credentials", async () => {
    const { user, rawPassword } = await createUser({ email: "login@test.com" });

    const res = await login(r("/api/auth/login", { email: "login@test.com", password: rawPassword }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.id).toBe(user.id);
    expect(data.user.email).toBe("login@test.com");
    expect(data.user.role).toBe("customer");
  });

  it("normalizes email casing and whitespace", async () => {
    await createUser({ email: "case@test.com", password: "Password123" });

    const res = await login(
      r("/api/auth/login", { email: "  CASE@test.com  ", password: "Password123" })
    );

    expect(res.status).toBe(200);
  });

  it("never returns the password hash", async () => {
    const { rawPassword } = await createUser({ email: "nopw@test.com" });

    const res = await login(r("/api/auth/login", { email: "nopw@test.com", password: rawPassword }));
    const data = await res.json();

    expect(data.user.password).toBeUndefined();
  });

  it("returns 401 on wrong password", async () => {
    await createUser({ email: "wrongpw@test.com" });

    const res = await login(r("/api/auth/login", { email: "wrongpw@test.com", password: "WrongPass999" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown email (same error as wrong password)", async () => {
    const res = await login(r("/api/auth/login", { email: "ghost@test.com", password: "anything" }));

    expect(res.status).toBe(401);
    const data = await res.json();
    // Must not reveal whether the email exists (user enumeration prevention)
    expect(data.error).toBe("Invalid email or password");
  });

  it("returns 400 when email is missing", async () => {
    const res = await login(r("/api/auth/login", { password: "Password123" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await login(r("/api/auth/login", { email: "test@test.com" }));
    expect(res.status).toBe(400);
  });

  it("rate limits repeated login attempts", async () => {
    let res: Response | undefined;
    for (let i = 0; i < 9; i += 1) {
      res = await login(r("/api/auth/login", { email: "limited@test.com", password: "bad" }));
    }

    expect(res?.status).toBe(429);
  });
});

// ─── Register ────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("creates user and returns token on valid data", async () => {
    const res = await register(
      r("/api/auth/register", {
        fullName: "New User",
        email: "newuser@test.com",
        password: "Secure1234",
        phone: "08011111111",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe("newuser@test.com");
    expect(data.user.role).toBe("customer");
  });

  it("never returns the password hash", async () => {
    const res = await register(
      r("/api/auth/register", { fullName: "Safe", email: "safe@test.com", password: "Password123" })
    );
    const data = await res.json();
    expect(data.user.password).toBeUndefined();
  });

  it("returns 409 on duplicate email", async () => {
    await createUser({ email: "dup@test.com" });

    const res = await register(
      r("/api/auth/register", { fullName: "Dup", email: "dup@test.com", password: "Password123" })
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 when fullName is missing", async () => {
    const res = await register(
      r("/api/auth/register", { email: "x@test.com", password: "Password123" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid email format", async () => {
    const res = await register(
      r("/api/auth/register", { fullName: "Bad", email: "not-an-email", password: "Password123" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 when password is under 8 characters", async () => {
    const res = await register(
      r("/api/auth/register", { fullName: "Short", email: "short@test.com", password: "abc" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/8 characters/i);
  });

  it("returns 400 when password has no number", async () => {
    const res = await register(
      r("/api/auth/register", {
        fullName: "No Number",
        email: "nonumber@test.com",
        password: "PasswordOnly",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/letters and numbers/i);
  });

  it("phone is optional — registers without it", async () => {
    const res = await register(
      r("/api/auth/register", { fullName: "Nophone", email: "nophone@test.com", password: "Password123" })
    );
    expect(res.status).toBe(201);
  });
});

// ─── Password reset ─────────────────────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  it("creates a reset token for existing accounts without exposing account existence", async () => {
    const { user } = await createUser({ email: "reset@test.com" });

    const res = await forgotPassword(
      r("/api/auth/forgot-password", { email: "reset@test.com" })
    );
    const data = await res.json();
    const tokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id },
    });

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/If an Ecobus account exists/i);
    expect(data.resetUrl).toContain("/reset-password?token=");
    expect(tokens).toHaveLength(1);
    expect(tokens[0].tokenHash).not.toContain(data.resetUrl.split("token=")[1]);
  });

  it("does not create a token for unknown accounts", async () => {
    const res = await forgotPassword(
      r("/api/auth/forgot-password", { email: "unknown@test.com" })
    );
    const tokens = await prisma.passwordResetToken.findMany();

    expect(res.status).toBe(200);
    expect(tokens).toHaveLength(0);
  });

  it("rejects invalid email formats", async () => {
    const res = await forgotPassword(
      r("/api/auth/forgot-password", { email: "not-an-email" })
    );

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("updates the password and consumes reset tokens", async () => {
    const { user } = await createUser({
      email: "reset-success@test.com",
      password: "OldPassword123",
    });
    const forgotRes = await forgotPassword(
      r("/api/auth/forgot-password", { email: "reset-success@test.com" })
    );
    const forgotData = await forgotRes.json();
    const token = new URL(forgotData.resetUrl).searchParams.get("token");

    const res = await resetPassword(
      r("/api/auth/reset-password", {
        token,
        password: "NewPassword123",
      })
    );
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const activeTokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id, usedAt: null },
    });

    expect(res.status).toBe(200);
    expect(await bcrypt.compare("NewPassword123", updated.password)).toBe(true);
    expect(activeTokens).toHaveLength(0);
  });

  it("rejects expired reset tokens", async () => {
    const { user } = await createUser({ email: "expired@test.com" });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken("expired-token"),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await resetPassword(
      r("/api/auth/reset-password", {
        token: "expired-token",
        password: "NewPassword123",
      })
    );

    expect(res.status).toBe(400);
  });

  it("rejects weak replacement passwords", async () => {
    const res = await resetPassword(
      r("/api/auth/reset-password", {
        token: "whatever",
        password: "weakpass",
      })
    );

    expect(res.status).toBe(400);
  });
});
