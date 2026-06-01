import { describe, it, expect } from "vitest";
import { GET as getAll } from "@/app/api/bookings/route";
import { GET as getOne } from "@/app/api/bookings/[bookingId]/route";
import { NextRequest } from "next/server";
import { createUser, createAdmin, createBooking, getRequest } from "../test-utils";

function rGet(path: string, token?: string): NextRequest {
  return getRequest(path, token) as unknown as NextRequest;
}

function params(bookingId: string) {
  return { params: Promise.resolve({ bookingId }) };
}

// ─── GET /api/bookings ────────────────────────────────────────────────────────

describe("GET /api/bookings", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await getAll(rGet("/api/bookings"));
    expect(res.status).toBe(401);
  });

  it("returns empty array for a new user with no bookings", async () => {
    const { token } = await createUser();
    const res = await getAll(rGet("/api/bookings", token));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns only the authenticated user's own bookings", async () => {
    const { user: u1, token: t1 } = await createUser({ email: "u1@test.com" });
    const { user: u2 } = await createUser({ email: "u2@test.com" });

    await createBooking(u1.id);
    await createBooking(u1.id);
    await createBooking(u2.id); // belongs to another user

    const res = await getAll(rGet("/api/bookings", t1));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    data.forEach((b: { passenger: { fullName: string } }) => {
      expect(b.passenger.fullName).toBe("John Doe");
    });
  });

  it("admin receives all bookings across all users", async () => {
    const { user: u1 } = await createUser({ email: "ua1@test.com" });
    const { user: u2 } = await createUser({ email: "ua2@test.com" });
    const { token: adminToken } = await createAdmin();

    await createBooking(u1.id);
    await createBooking(u2.id);
    await createBooking(null); // guest booking

    const res = await getAll(rGet("/api/bookings", adminToken));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(3);
  });

  it("response objects do not leak internal fields (paystackRef, userId)", async () => {
    const { user, token } = await createUser();
    await createBooking(user.id);

    const res = await getAll(rGet("/api/bookings", token));
    const [booking] = await res.json();

    expect(booking.paystackRef).toBeUndefined();
    expect(booking.userId).toBeUndefined();
    expect(booking.password).toBeUndefined();
  });

  it("returns bookings ordered newest first", async () => {
    const { user, token } = await createUser();
    const b1 = await createBooking(user.id, "ref-older");
    // small delay so createdAt differs
    await new Promise((r) => setTimeout(r, 50));
    const b2 = await createBooking(user.id, "ref-newer");

    const res = await getAll(rGet("/api/bookings", token));
    const data = await res.json();

    expect(data[0].reference).toBe(b2.reference);
    expect(data[1].reference).toBe(b1.reference);
  });
});

// ─── GET /api/bookings/[bookingId] ────────────────────────────────────────────

describe("GET /api/bookings/[bookingId]", () => {
  it("guest confirmation links can fetch guest bookings without a token", async () => {
    const booking = await createBooking(null);
    const res = await getOne(rGet(`/api/bookings/${booking.id}`), params(booking.id));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(booking.id);
  });

  it("owner can fetch their own booking", async () => {
    const { user, token } = await createUser();
    const booking = await createBooking(user.id);

    const res = await getOne(rGet(`/api/bookings/${booking.id}`, token), params(booking.id));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(booking.id);
    expect(data.reference).toBe(booking.reference);
  });

  it("returns 403 when a different user tries to access another user's booking", async () => {
    const { user: owner } = await createUser({ email: "owner@test.com" });
    const { token: intruderToken } = await createUser({ email: "intruder@test.com" });
    const booking = await createBooking(owner.id);

    const res = await getOne(
      rGet(`/api/bookings/${booking.id}`, intruderToken),
      params(booking.id)
    );
    expect(res.status).toBe(403);
  });

  it("admin can access any user's booking", async () => {
    const { user } = await createUser({ email: "someuser@test.com" });
    const { token: adminToken } = await createAdmin();
    const booking = await createBooking(user.id);

    const res = await getOne(
      rGet(`/api/bookings/${booking.id}`, adminToken),
      params(booking.id)
    );
    expect(res.status).toBe(200);
  });

  it("admin can access guest bookings (userId null)", async () => {
    const { token: adminToken } = await createAdmin();
    const booking = await createBooking(null);

    const res = await getOne(
      rGet(`/api/bookings/${booking.id}`, adminToken),
      params(booking.id)
    );
    expect(res.status).toBe(200);
  });

  it("authenticated customers can open guest confirmation links", async () => {
    const { token } = await createUser();
    const booking = await createBooking(null); // guest booking, userId = null

    const res = await getOne(
      rGet(`/api/bookings/${booking.id}`, token),
      params(booking.id)
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 for a non-existent booking ID", async () => {
    const { token } = await createAdmin();
    const res = await getOne(
      rGet("/api/bookings/does-not-exist-id", token),
      params("does-not-exist-id")
    );
    expect(res.status).toBe(404);
  });

  it("response does not leak paystackRef or internal DB fields", async () => {
    const { user, token } = await createUser();
    const booking = await createBooking(user.id);

    const res = await getOne(
      rGet(`/api/bookings/${booking.id}`, token),
      params(booking.id)
    );
    const data = await res.json();

    expect(data.paystackRef).toBeUndefined();
    expect(data.userId).toBeUndefined();
    expect(data.seatsJson).toBeUndefined();
    expect(data.passengerName).toBeUndefined();
  });
});
