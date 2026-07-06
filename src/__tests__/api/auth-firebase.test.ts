import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as firebaseAuth } from "@/app/api/auth/firebase/route";
import { prisma } from "@/lib/prisma";
import { createAdmin, jsonRequest } from "../test-utils";

const verifyFirebaseIdToken = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseIdToken: (...args: unknown[]) => verifyFirebaseIdToken(...args),
}));

function r(body: unknown): NextRequest {
  return jsonRequest("/api/auth/firebase", "POST", body) as unknown as NextRequest;
}

describe("POST /api/auth/firebase", () => {
  beforeEach(() => {
    verifyFirebaseIdToken.mockReset();
  });

  it("returns 400 when idToken is missing", async () => {
    const res = await firebaseAuth(r({}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when the Firebase token is invalid", async () => {
    verifyFirebaseIdToken.mockRejectedValue(new Error("invalid token"));

    const res = await firebaseAuth(r({ idToken: "bad-token" }));
    expect(res.status).toBe(401);
  });

  it("creates a new customer account on first sign-in", async () => {
    verifyFirebaseIdToken.mockResolvedValue({
      uid: "firebase-uid-1",
      email: "newgoogleuser@test.com",
      name: "Google User",
    });

    const res = await firebaseAuth(r({ idToken: "good-token" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe("newgoogleuser@test.com");
    expect(data.user.name).toBe("Google User");
    expect(data.user.role).toBe("customer");

    const user = await prisma.user.findUnique({ where: { email: "newgoogleuser@test.com" } });
    expect(user).not.toBeNull();
    expect(user?.password).not.toBe("");
  });

  it("does not create a duplicate user on repeat sign-in with the same email", async () => {
    verifyFirebaseIdToken.mockResolvedValue({
      uid: "firebase-uid-2",
      email: "repeat@test.com",
      name: "Repeat User",
    });

    const res1 = await firebaseAuth(r({ idToken: "token-1" }));
    const data1 = await res1.json();

    const res2 = await firebaseAuth(r({ idToken: "token-2" }));
    const data2 = await res2.json();

    expect(data1.user.id).toBe(data2.user.id);

    const count = await prisma.user.count({ where: { email: "repeat@test.com" } });
    expect(count).toBe(1);
  });

  it("links to an existing account by email and preserves its role", async () => {
    const { user } = await createAdmin();
    verifyFirebaseIdToken.mockResolvedValue({
      uid: "firebase-uid-admin",
      email: user.email,
      name: "Admin Via Google",
    });

    const res = await firebaseAuth(r({ idToken: "admin-token" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe(user.id);
    expect(data.user.role).toBe("admin");
  });

  it("never returns the password hash", async () => {
    verifyFirebaseIdToken.mockResolvedValue({
      uid: "firebase-uid-3",
      email: "nopw@test.com",
      name: null,
    });

    const res = await firebaseAuth(r({ idToken: "token" }));
    const data = await res.json();

    expect(data.user.password).toBeUndefined();
  });

  it("rate limits repeated sign-in attempts", async () => {
    verifyFirebaseIdToken.mockRejectedValue(new Error("invalid"));

    let res: Response | undefined;
    for (let i = 0; i < 16; i += 1) {
      res = await firebaseAuth(r({ idToken: "bad" }));
    }

    expect(res?.status).toBe(429);
  });
});
