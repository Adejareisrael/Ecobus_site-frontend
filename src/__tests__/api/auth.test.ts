import { describe, it, expect } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
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

  it("phone is optional — registers without it", async () => {
    const res = await register(
      r("/api/auth/register", { fullName: "Nophone", email: "nophone@test.com", password: "Password123" })
    );
    expect(res.status).toBe(201);
  });
});
