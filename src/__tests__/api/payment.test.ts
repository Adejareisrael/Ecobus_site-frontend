import { describe, it, expect } from "vitest";
import { POST as verify } from "@/app/api/payment/verify/route";
import { POST as webhook } from "@/app/api/payment/webhook/route";
import { NextRequest } from "next/server";
import crypto from "crypto";
import {
  createUser,
  createBooking,
  jsonRequest,
  TEST_TRIP,
  TEST_SEATS,
  TEST_TRAVEL_DATE,
  TEST_PASSENGER,
  EXPECTED_KOBO,
  stubPaystackSuccess,
  stubPaystackFailed,
} from "../test-utils";
import { prisma } from "@/lib/prisma";

function r(body: unknown, token?: string): NextRequest {
  return jsonRequest("/api/payment/verify", "POST", body, token) as unknown as NextRequest;
}

function signedWebhookRequest(body: unknown, signature?: string): NextRequest {
  const raw = JSON.stringify(body);
  const digest =
    signature ??
    crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(raw)
      .digest("hex");

  return new Request("http://localhost:3000/api/payment/webhook", {
    method: "POST",
    headers: { "x-paystack-signature": digest },
    body: raw,
  }) as unknown as NextRequest;
}

const validBody = (reference: string) => ({
  reference,
  trip: TEST_TRIP,
  travelDate: TEST_TRAVEL_DATE,
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

    const deliveries = await prisma.ticketDelivery.findMany({
      where: { bookingId: data.id },
      orderBy: { channel: "asc" },
    });
    expect(deliveries).toHaveLength(3);
    expect(deliveries.map((delivery) => delivery.channel).sort()).toEqual([
      "email",
      "sms",
      "whatsapp",
    ]);
    expect(deliveries.every((delivery) => delivery.status === "Pending")).toBe(true);
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
    const deliveryCount = await prisma.ticketDelivery.count({
      where: { bookingId: data1.id },
    });
    expect(deliveryCount).toBe(3);
  });

  it("returns 409 when a selected seat is already booked", async () => {
    const ref1 = "ps-ref-seat-lock-1";
    stubPaystackSuccess(ref1);

    const res1 = await verify(r(validBody(ref1)));
    expect(res1.status).toBe(201);

    const ref2 = "ps-ref-seat-lock-2";
    stubPaystackSuccess(ref2);

    const res2 = await verify(r(validBody(ref2)));
    const data = await res2.json();

    expect(res2.status).toBe(409);
    expect(data.error).toMatch(/already booked/i);
  });

  it("allows the same seat on the same trip for a different travel date", async () => {
    const ref1 = "ps-ref-date-lock-1";
    stubPaystackSuccess(ref1);

    const res1 = await verify(r(validBody(ref1)));
    expect(res1.status).toBe(201);

    const ref2 = "ps-ref-date-lock-2";
    stubPaystackSuccess(ref2);

    const res2 = await verify(
      r({
        ...validBody(ref2),
        travelDate: "2026-05-28",
      })
    );

    expect(res2.status).toBe(201);
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

  it("stores payment fields on successful verification", async () => {
    const ref = "ps-ref-payment-fields";
    stubPaystackSuccess(ref);

    const res = await verify(r(validBody(ref)));
    expect(res.status).toBe(201);

    const booking = await prisma.booking.findUnique({ where: { paystackRef: ref } });
    expect(booking?.paymentStatus).toBe("Paid");
    expect(booking?.amountPaid).toBe(TEST_TRIP.price * TEST_SEATS.length * 100);
    expect(booking?.currency).toBe("NGN");
    expect(booking?.paidAt).toBeInstanceOf(Date);
  });

  it("applies promo codes to the verified payment amount and booking", async () => {
    const ref = "ps-ref-promo-success";
    await prisma.promoCode.create({
      data: {
        code: "ECO10",
        description: "Ten percent off",
        discountType: "percentage",
        discountValue: 10,
        minSpend: 0,
        maxUses: null,
        isActive: true,
      },
    });
    stubPaystackSuccess(ref, EXPECTED_KOBO * 0.9);

    const res = await verify(r({ ...validBody(ref), promoCode: "eco10" }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.promoCode).toBe("ECO10");
    expect(data.discountAmount).toBe(1000);

    const booking = await prisma.booking.findUnique({ where: { paystackRef: ref } });
    const promo = await prisma.promoCode.findUnique({ where: { code: "ECO10" } });

    expect(booking?.amountPaid).toBe(EXPECTED_KOBO * 0.9);
    expect(booking?.promoCode).toBe("ECO10");
    expect(booking?.discountAmount).toBe(1000);
    expect(promo?.usedCount).toBe(1);
  });

  it("rejects payments that ignore an applied promo discount", async () => {
    const ref = "ps-ref-promo-wrong-amount";
    await prisma.promoCode.create({
      data: {
        code: "ECO20",
        discountType: "percentage",
        discountValue: 20,
        minSpend: 0,
        isActive: true,
      },
    });
    stubPaystackSuccess(ref, EXPECTED_KOBO);

    const res = await verify(r({ ...validBody(ref), promoCode: "ECO20" }));
    const data = await res.json();

    expect(res.status).toBe(402);
    expect(data.error).toMatch(/amount/i);
  });
});

describe("POST /api/payment/webhook", () => {
  it("rejects invalid Paystack signatures", async () => {
    const res = await webhook(
      signedWebhookRequest(
        {
          event: "charge.success",
          data: { reference: "bad-ref", status: "success", amount: 100, currency: "NGN" },
        },
        "invalid-signature"
      )
    );

    expect(res.status).toBe(401);
  });

  it("updates an existing booking from a valid Paystack webhook", async () => {
    const booking = await createBooking(null, "ps-ref-webhook-success");

    const res = await webhook(
      signedWebhookRequest({
        event: "charge.success",
        data: {
          reference: booking.paystackRef,
          status: "success",
          amount: 1000000,
          currency: "NGN",
          paid_at: "2026-05-26T08:00:00.000Z",
        },
      })
    );

    expect(res.status).toBe(200);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.paymentStatus).toBe("Paid");
    expect(updated?.status).toBe("Confirmed");
    expect(updated?.amountPaid).toBe(1000000);
    expect(updated?.paidAt?.toISOString()).toBe("2026-05-26T08:00:00.000Z");
  });

  it("marks existing bookings failed when Paystack reports failure", async () => {
    const booking = await createBooking(null, "ps-ref-webhook-failed");

    const res = await webhook(
      signedWebhookRequest({
        event: "charge.failed",
        data: {
          reference: booking.paystackRef,
          status: "failed",
          amount: 1000000,
          currency: "NGN",
        },
      })
    );

    expect(res.status).toBe(200);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated?.paymentStatus).toBe("Failed");
    expect(updated?.status).toBe("Failed");
  });
});
