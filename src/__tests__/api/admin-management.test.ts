import { describe, expect, it } from "vitest";
import { GET as getTrips, POST as createTrip } from "@/app/api/trips/route";
import { GET as getSettings, PATCH as updateSettings } from "@/app/api/site-settings/route";
import {
  GET as getPromos,
  POST as createPromo,
} from "@/app/api/promo-codes/route";
import {
  DELETE as deletePromo,
  PATCH as updatePromo,
} from "@/app/api/promo-codes/[promoId]/route";
import { POST as validatePromo } from "@/app/api/promo-codes/validate/route";
import {
  GET as getBooking,
  PATCH as updateBooking,
} from "@/app/api/bookings/[bookingId]/route";
import { NextRequest } from "next/server";
import {
  createAdmin,
  createBooking,
  createUser,
  getRequest,
  jsonRequest,
} from "../test-utils";

function rGet(path: string, token?: string): NextRequest {
  return getRequest(path, token) as unknown as NextRequest;
}

function rJson(path: string, method: string, body: unknown, token?: string): NextRequest {
  return jsonRequest(path, method, body, token) as unknown as NextRequest;
}

function params(bookingId: string) {
  return { params: Promise.resolve({ bookingId }) };
}

function promoParams(promoId: string) {
  return { params: Promise.resolve({ promoId }) };
}

const validTrip = {
  departureTerminalId: "lagos-fadeyi",
  destinationTerminalId: "benin-idokpa",
  routeLabel: "Lagos Fadeyi -> Benin Idokpa",
  departureTime: "07:00",
  arrivalTime: "11:30",
  price: 15000,
  availableSeats: 14,
  busType: "Toyota",
};

describe("admin trip permissions", () => {
  it("allows public trip listing but protects includeInactive", async () => {
    const publicRes = await getTrips(rGet("/api/trips"));
    expect(publicRes.status).toBe(200);

    const protectedRes = await getTrips(rGet("/api/trips?includeInactive=true"));
    expect(protectedRes.status).toBe(401);
  });

  it("rejects customer tokens for admin trip listing", async () => {
    const { token } = await createUser();

    const res = await getTrips(rGet("/api/trips?includeInactive=true", token));
    expect(res.status).toBe(403);
  });

  it("allows admins to create trips", async () => {
    const { token } = await createAdmin();

    const res = await createTrip(rJson("/api/trips", "POST", validTrip, token));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.routeLabel).toBe(validTrip.routeLabel);
  });

  it("rejects customers creating trips", async () => {
    const { token } = await createUser();

    const res = await createTrip(rJson("/api/trips", "POST", validTrip, token));
    expect(res.status).toBe(403);
  });
});

describe("admin settings permissions", () => {
  it("rejects unauthenticated settings updates", async () => {
    const res = await updateSettings(
      rJson("/api/site-settings", "PATCH", { heroBrand: "Nope" })
    );

    expect(res.status).toBe(401);
  });

  it("rejects customer settings updates", async () => {
    const { token } = await createUser();

    const res = await updateSettings(
      rJson("/api/site-settings", "PATCH", { heroBrand: "Nope" }, token)
    );

    expect(res.status).toBe(403);
  });

  it("allows admin settings updates", async () => {
    const { token } = await createAdmin();

    const res = await updateSettings(
      rJson(
        "/api/site-settings",
        "PATCH",
        {
          heroBrand: "Ecobus Pro",
          facebookUrl: "https://facebook.com/Ecobus.ng",
          instagramUrl: "https://instagram.com/Ecobus_transport",
          xUrl: "https://x.com/Ecobustransport",
        },
        token
      )
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.heroBrand).toBe("Ecobus Pro");
    expect(data.facebookUrl).toBe("https://facebook.com/Ecobus.ng");
    expect(data.instagramUrl).toBe("https://instagram.com/Ecobus_transport");
    expect(data.xUrl).toBe("https://x.com/Ecobustransport");
  });

  it("returns social URLs on public settings", async () => {
    const res = await getSettings();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.facebookUrl).toMatch(/^https:\/\/facebook\.com/);
    expect(data.instagramUrl).toMatch(/^https:\/\/instagram\.com/);
    expect(data.xUrl).toMatch(/^https:\/\/x\.com/);
  });
});

describe("admin promo code management", () => {
  const validPromo = {
    code: "ECO10",
    description: "Launch promo",
    discountType: "percentage",
    discountValue: 10,
    minSpend: 0,
    maxUses: null,
    startsAt: null,
    expiresAt: null,
    isActive: true,
  };

  it("protects promo code listing from guests", async () => {
    const res = await getPromos(rGet("/api/promo-codes"));
    expect(res.status).toBe(401);
  });

  it("allows admins to create, edit, validate, and delete promo codes", async () => {
    const { token } = await createAdmin();

    const createRes = await createPromo(
      rJson("/api/promo-codes", "POST", validPromo, token)
    );
    const created = await createRes.json();

    expect(createRes.status).toBe(201);
    expect(created.code).toBe("ECO10");

    const validateRes = await validatePromo(
      rJson("/api/promo-codes/validate", "POST", { code: "eco10", total: 10000 })
    );
    const validation = await validateRes.json();

    expect(validateRes.status).toBe(200);
    expect(validation.discountAmount).toBe(1000);
    expect(validation.totalAfterDiscount).toBe(9000);

    const updateRes = await updatePromo(
      rJson(
        `/api/promo-codes/${created.id}`,
        "PATCH",
        { ...validPromo, discountValue: 15 },
        token
      ),
      promoParams(created.id)
    );
    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.discountValue).toBe(15);

    const deleteRes = await deletePromo(
      rJson(`/api/promo-codes/${created.id}`, "DELETE", {}, token),
      promoParams(created.id)
    );

    expect(deleteRes.status).toBe(200);
  });

  it("rejects customer promo management", async () => {
    const { token } = await createUser();

    const res = await createPromo(
      rJson("/api/promo-codes", "POST", validPromo, token)
    );

    expect(res.status).toBe(403);
  });
});

describe("admin booking management permissions", () => {
  it("allows a guest confirmation page to load its ticket by id", async () => {
    const booking = await createBooking(null);

    const res = await getBooking(rGet(`/api/bookings/${booking.id}`), params(booking.id));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(booking.id);
  });

  it("rejects customers changing booking status", async () => {
    const { token } = await createUser();
    const booking = await createBooking(null);

    const res = await updateBooking(
      rJson(`/api/bookings/${booking.id}`, "PATCH", { status: "Cancelled" }, token),
      params(booking.id)
    );

    expect(res.status).toBe(403);
  });

  it("allows admins changing booking status", async () => {
    const { token } = await createAdmin();
    const booking = await createBooking(null);

    const res = await updateBooking(
      rJson(`/api/bookings/${booking.id}`, "PATCH", { status: "Cancelled" }, token),
      params(booking.id)
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("Cancelled");
  });
});
