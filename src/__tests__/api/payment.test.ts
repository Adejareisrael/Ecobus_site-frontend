import { describe, it, expect } from "vitest";
import { POST as verify } from "@/app/api/payment/verify/route";
import { NextRequest } from "next/server";
import {
  createUser,
  createBooking,
  jsonRequest,
  TEST_TRIP,
  TEST_SEATS,
  TEST_PASSENGER,
  EXPECTED_KOBO,
  stubPaystackSuccess,
  stubPaystackFailed,
} from "../test-utils";
import { prisma } from "@/lib/prisma";

function r(body: unknown, token?: string): NextRequest {
  return jsonRequest("/api/payment/verify", "POST", body, token) as unknown as NextRequest;
}

const validBody = (reference: string) => ({
  reference,
  trip: TEST_TRIP,
  seats: TEST_SEATS,
  passenger: TEST_PASSENGER,
});

// ─── Payment verification ─────────────────────────────────────────────────────

describe("POST /api/payment/verify", () => {
  it("creates booking on successful Paystack verification", async () => {
    const ref = "ps-ref-success-1";
    stubPaystackSuccess(ref);

    const res = await verify(r(validBody(ref)));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBeDefined();
    expect(data.reference).toMatch(/^ECO-/);
    expect(data.trip.routeLabel).toBe("Lagos → Abuja");
    expect(data.seats).toEqual(TEST_SEATS);
    expect(data.passenger.fullName).toBe("John Doe");
    expect(data.status).toBe("Confirmed");
  });

  it("attaches userId when request carries a valid JWT", async () => {
    const ref = "ps-ref-auth-1";
    stubPaystackSuccess(ref);
    const { user, token } = await createUser();

    const res = await verify(r(validBody(ref), token));
    expect(res.status).toBe(201);

    const booking = await prisma.booking.findFirst({ where: { paystackRef: ref } });
    expect(booking?.userId).toBe(user.id);
  });

  it("booking userId is null for unauthenticated (guest) payments", async () => {
    const ref = "ps-ref-guest-1";
    stubPaystackSuccess(ref);

    await verify(r(validBody(ref)));

    const booking = await prisma.booking.findFirst({ where: { paystackRef: ref } });
    expect(booking?.userId).toBeNull();
  });

  it("returns 402 when amount paid does not match booking total", async () => {
    const ref = "ps-ref-wrong-amount";
    // Paystack says ₦1 was paid (100 kobo), but booking expects EXPECTED_KOBO
    stubPaystackSuccess(ref, 100);

    const res = await verify(r(validBody(ref)));
    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.error).toMatch(/amount/i);
  });

  it("returns 402 when Paystack reports payment failure", async () => {
    stubPaystackFailed();

    const res = await verify(r(validBody("ps-ref-failed")));
    expect(res.status).toBe(402);
  });

  it("is idempotent — returns existing booking on duplicate reference", async () => {
    const ref = "ps-ref-idempotent";
    stubPaystackSuccess(ref);

    // First call — creates booking
    const res1 = await verify(r(validBody(ref)));
    expect(res1.status).toBe(201);
    const data1 = await res1.json();

    // Stub again for second call (fetch will be called again)
    stubPaystackSuccess(ref);

    // Second call — same reference, should return the same booking
    const res2 = await verify(r(validBody(ref)));
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.id).toBe(data1.id);

    // Only one booking should exist in DB
    const count = await prisma.booking.count({ where: { paystackRef: ref } });
    expect(count).toBe(1);
  });

  it("returns 400 when reference is missing", async () => {
    const res = await verify(r({ trip: TEST_TRIP, seats: TEST_SEATS, passenger: TEST_PASSENGER }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when trip is missing", async () => {
    const res = await verify(r({ reference: "x", seats: TEST_SEATS, passenger: TEST_PASSENGER }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when seats array is empty", async () => {
    const res = await verify(r({ reference: "x", trip: TEST_TRIP, seats: [], passenger: TEST_PASSENGER }));
    expect(res.status).toBe(400);
  });

  it("does not expose internal booking data (paystackRef) in response", async () => {
    const ref = "ps-ref-leak-check";
    stubPaystackSuccess(ref);

    const res = await verify(r(validBody(ref)));
    const data = await res.json();

    expect(data.paystackRef).toBeUndefined();
    expect(data.userId).toBeUndefined();
  });
});
