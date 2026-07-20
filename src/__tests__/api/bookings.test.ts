import { describe, it, expect } from "vitest";
import { GET as getAll, POST as createReservation } from "@/app/api/bookings/route";
import { GET as getOne } from "@/app/api/bookings/[bookingId]/route";
import { NextRequest } from "next/server";
import {
  createUser,
  createAdmin,
  createBooking,
  getRequest,
  jsonRequest,
  TEST_TRIP,
  TEST_SEATS,
  TEST_TRAVEL_DATE,
  TEST_PASSENGER,
} from "../test-utils";
import { prisma } from "@/lib/prisma";

function rGet(path: string, token?: string): NextRequest {
  return getRequest(path, token) as unknown as NextRequest;
}

function rPost(body: unknown, token?: string): NextRequest {
  return jsonRequest("/api/bookings", "POST", body, token) as unknown as NextRequest;
}

function params(bookingId: string) {
  return { params: Promise.resolve({ bookingId }) };
}

const validBody = () => ({
  trip: TEST_TRIP,
  travelDate: TEST_TRAVEL_DATE,
  seats: TEST_SEATS,
  passenger: TEST_PASSENGER,
});

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

  it("response objects do not leak internal fields (userId)", async () => {
    const { user, token } = await createUser();
    await createBooking(user.id);

    const res = await getAll(rGet("/api/bookings", token));
    const [booking] = await res.json();

    expect(booking.userId).toBeUndefined();
    expect(booking.password).toBeUndefined();
  });

  it("returns bookings ordered newest first", async () => {
    const { user, token } = await createUser();
    const b1 = await createBooking(user.id);
    // small delay so createdAt differs
    await new Promise((r) => setTimeout(r, 50));
    const b2 = await createBooking(user.id);

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

  it("response does not leak internal DB fields", async () => {
    const { user, token } = await createUser();
    const booking = await createBooking(user.id);

    const res = await getOne(
      rGet(`/api/bookings/${booking.id}`, token),
      params(booking.id)
    );
    const data = await res.json();

    expect(data.userId).toBeUndefined();
    expect(data.seatsJson).toBeUndefined();
    expect(data.passengerName).toBeUndefined();
  });
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────

describe("POST /api/bookings", () => {
  it("creates a Pending reservation with no online payment", async () => {
    const res = await createReservation(rPost(validBody()));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBeDefined();
    expect(data.reference).toMatch(/^ECO-/);
    expect(data.trip.routeLabel).toBe("Lagos → Abuja");
    expect(data.seats).toEqual(TEST_SEATS);
    expect(data.passenger.fullName).toBe("John Doe");
    expect(data.status).toBe("Pending");

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
  });

  it("attaches userId when request carries a valid JWT", async () => {
    const { user, token } = await createUser();

    const res = await createReservation(rPost(validBody(), token));
    const data = await res.json();

    expect(res.status).toBe(201);
    const booking = await prisma.booking.findUnique({ where: { id: data.id } });
    expect(booking?.userId).toBe(user.id);
  });

  it("booking userId is null for unauthenticated (guest) reservations", async () => {
    const res = await createReservation(rPost(validBody()));
    const data = await res.json();

    const booking = await prisma.booking.findUnique({ where: { id: data.id } });
    expect(booking?.userId).toBeNull();
  });

  it("returns 400 when trip is missing", async () => {
    const res = await createReservation(
      rPost({ seats: TEST_SEATS, passenger: TEST_PASSENGER })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when seats array is empty", async () => {
    const res = await createReservation(
      rPost({ trip: TEST_TRIP, seats: [], passenger: TEST_PASSENGER })
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when a selected seat is already reserved", async () => {
    const res1 = await createReservation(rPost(validBody()));
    expect(res1.status).toBe(201);

    const res2 = await createReservation(rPost(validBody()));
    const data = await res2.json();

    expect(res2.status).toBe(409);
    expect(data.error).toMatch(/already booked/i);
  });

  it("allows the same seat on the same trip for a different travel date", async () => {
    const res1 = await createReservation(rPost(validBody()));
    expect(res1.status).toBe(201);

    const res2 = await createReservation(
      rPost({ ...validBody(), travelDate: "2026-05-28" })
    );
    expect(res2.status).toBe(201);
  });

  it("only lets one of two concurrent requests for the same seat succeed", async () => {
    const [res1, res2] = await Promise.all([
      createReservation(rPost(validBody())),
      createReservation(rPost(validBody())),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const pendingCount = await prisma.booking.count({
      where: {
        tripId: TEST_TRIP.id,
        travelDate: TEST_TRAVEL_DATE,
        status: "Pending",
      },
    });
    expect(pendingCount).toBe(1);
  });

  it("applies promo codes to the booking total", async () => {
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

    const res = await createReservation(
      rPost({ ...validBody(), promoCode: "eco10" })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.promoCode).toBe("ECO10");
    expect(data.discountAmount).toBe(1000);

    const promo = await prisma.promoCode.findUnique({ where: { code: "ECO10" } });
    expect(promo?.usedCount).toBe(1);
  });

  it("only lets one of two concurrent bookings redeem a single-use promo code", async () => {
    await prisma.promoCode.create({
      data: {
        code: "RACEPROMO",
        discountType: "percentage",
        discountValue: 10,
        minSpend: 0,
        maxUses: 1,
        isActive: true,
      },
    });

    const [res1, res2] = await Promise.all([
      createReservation(
        rPost({ ...validBody(), seats: ["A1", "A2"], promoCode: "racepromo" })
      ),
      createReservation(
        rPost({ ...validBody(), seats: ["B1", "B2"], promoCode: "racepromo" })
      ),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const promo = await prisma.promoCode.findUnique({ where: { code: "RACEPROMO" } });
    expect(promo?.usedCount).toBe(1);
  });
});
