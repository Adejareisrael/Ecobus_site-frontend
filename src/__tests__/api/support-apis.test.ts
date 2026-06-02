import { describe, expect, it } from "vitest";
import { GET as lookupBooking } from "@/app/api/bookings/lookup/route";
import { GET as health } from "@/app/api/health/route";
import {
  GET as validateTicket,
  POST as checkInTicket,
} from "@/app/api/tickets/validate/route";
import {
  GET as getLayouts,
  POST as createLayout,
} from "@/app/api/bus-layouts/route";
import {
  DELETE as deleteLayout,
  PATCH as updateLayout,
} from "@/app/api/bus-layouts/[layoutId]/route";
import { GET as getDeliveries } from "@/app/api/ticket-deliveries/route";
import { PATCH as updateDelivery } from "@/app/api/ticket-deliveries/[deliveryId]/route";
import { NextRequest } from "next/server";
import {
  createAdmin,
  createBooking,
  createUser,
  jsonRequest,
} from "../test-utils";
import { prisma } from "@/lib/prisma";

function rGet(path: string, token?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function rJson(path: string, method: string, body: unknown, token?: string): NextRequest {
  return jsonRequest(path, method, body, token) as unknown as NextRequest;
}

function layoutParams(layoutId: string) {
  return { params: Promise.resolve({ layoutId }) };
}

const layoutInput = {
  name: "QA Toyota Layout",
  model: "Toyota",
  isDefault: false,
  seats: [
    { id: "seat-1", label: "1", isAvailable: true, row: 1, column: 4 },
    { id: "seat-2", label: "2", isAvailable: true, row: 2, column: 1 },
  ],
};

describe("customer booking lookup", () => {
  it("finds a booking by reference and passenger contact", async () => {
    const booking = await createBooking(null);

    const res = await lookupBooking(
      rGet(`/api/bookings/lookup?reference=${booking.reference}&contact=john@test.com`)
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.bookings[0].id).toBe(booking.id);
    expect(data.bookings[0].seats).toEqual(["A1", "A2"]);
  });

  it("finds a booking by passenger contact only", async () => {
    const booking = await createBooking(null);

    const res = await lookupBooking(
      rGet("/api/bookings/lookup?contact=john@test.com")
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.bookings.map((item: { id: string }) => item.id)).toContain(booking.id);
  });

  it("rejects guest lookup without passenger contact", async () => {
    const res = await lookupBooking(rGet("/api/bookings/lookup?reference=ECO-123"));
    expect(res.status).toBe(400);
  });
});

describe("health check", () => {
  it("reports basic database counts", async () => {
    const res = await health();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.counts).toEqual(
      expect.objectContaining({
        trips: expect.any(Number),
        bookings: expect.any(Number),
        terminals: expect.any(Number),
      })
    );
  });
});

describe("admin ticket validation", () => {
  it("requires admin access", async () => {
    const booking = await createBooking(null);
    const res = await validateTicket(
      rGet(`/api/tickets/validate?bookingId=${booking.id}`)
    );

    expect(res.status).toBe(401);
  });

  it("validates a confirmed ticket by booking id", async () => {
    const { token } = await createAdmin();
    const booking = await createBooking(null);

    const res = await validateTicket(
      rGet(`/api/tickets/validate?bookingId=${booking.id}`, token)
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.reference).toBe(booking.reference);
    expect(data.passenger.email).toBe("john@test.com");
    expect(data.checkedIn).toBe(false);
    expect(data.checkedInAt).toBeNull();
  });

  it("checks in a confirmed ticket once and records the admin", async () => {
    const { token } = await createAdmin();
    const booking = await createBooking(null);

    const res = await checkInTicket(
      rJson("/api/tickets/validate", "POST", { bookingId: booking.id }, token)
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkedIn).toBe(true);
    expect(data.checkedInAt).toEqual(expect.any(String));
    expect(data.checkedInBy).toBe("admin@ecobus.ng");

    const saved = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(saved?.checkedInAt).toBeInstanceOf(Date);
    expect(saved?.checkedInBy).toBe("admin@ecobus.ng");
  });

  it("blocks duplicate check-ins", async () => {
    const { token } = await createAdmin();
    const booking = await createBooking(null);

    const first = await checkInTicket(
      rJson("/api/tickets/validate", "POST", { reference: booking.reference }, token)
    );
    expect(first.status).toBe(200);

    const second = await checkInTicket(
      rJson("/api/tickets/validate", "POST", { reference: booking.reference }, token)
    );
    const data = await second.json();

    expect(second.status).toBe(409);
    expect(data.error).toMatch(/already/i);
  });

  it("blocks check-in for non-confirmed tickets", async () => {
    const { token } = await createAdmin();
    const booking = await createBooking(null);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "Cancelled" },
    });

    const res = await checkInTicket(
      rJson("/api/tickets/validate", "POST", { bookingId: booking.id }, token)
    );
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/confirmed/i);
  });
});

describe("admin bus layout management", () => {
  it("protects layout listing from guests and customers", async () => {
    const guestRes = await getLayouts(rGet("/api/bus-layouts"));
    expect(guestRes.status).toBe(401);

    const { token } = await createUser();
    const customerRes = await getLayouts(rGet("/api/bus-layouts", token));
    expect(customerRes.status).toBe(403);
  });

  it("allows admins to create, update, and delete unattached layouts", async () => {
    const { token } = await createAdmin();

    const createRes = await createLayout(
      rJson("/api/bus-layouts", "POST", layoutInput, token)
    );
    const created = await createRes.json();

    expect(createRes.status).toBe(201);
    expect(created.totalSeats).toBe(2);

    const updateRes = await updateLayout(
      rJson(
        `/api/bus-layouts/${created.id}`,
        "PATCH",
        { ...layoutInput, name: "QA Updated Layout" },
        token
      ),
      layoutParams(created.id)
    );
    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.name).toBe("QA Updated Layout");

    const deleteRes = await deleteLayout(
      rJson(`/api/bus-layouts/${created.id}`, "DELETE", {}, token),
      layoutParams(created.id)
    );

    expect(deleteRes.status).toBe(200);
  });

  it("blocks deleting layouts assigned to trips", async () => {
    const { token } = await createAdmin();
    const layout = await prisma.busLayout.create({
      data: {
        name: "Attached QA Layout",
        model: "Toyota",
        totalSeats: 2,
        seatsJson: JSON.stringify(layoutInput.seats),
        isDefault: false,
      },
    });
    await prisma.trip.update({
      where: { id: "trip-001" },
      data: { busLayoutId: layout.id },
    });

    const res = await deleteLayout(
      rJson(`/api/bus-layouts/${layout.id}`, "DELETE", {}, token),
      layoutParams(layout.id)
    );

    expect(res.status).toBe(409);
  });
});

describe("admin ticket delivery outbox", () => {
  it("protects ticket delivery listing from guests", async () => {
    const res = await getDeliveries(rGet("/api/ticket-deliveries"));
    expect(res.status).toBe(401);
  });

  it("allows admins to list and update delivery statuses", async () => {
    const { token } = await createAdmin();
    const booking = await createBooking(null);
    const delivery = await prisma.ticketDelivery.create({
      data: {
        bookingId: booking.id,
        reference: booking.reference,
        channel: "email",
        recipient: "john@test.com",
        subject: `Ecobus ticket ${booking.reference}`,
        message: "Ticket message",
        status: "Pending",
      },
    });

    const listRes = await getDeliveries(
      rGet("/api/ticket-deliveries?status=Pending", token)
    );
    const deliveries = await listRes.json();

    expect(listRes.status).toBe(200);
    expect(deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: delivery.id,
          channel: "email",
          status: "Pending",
        }),
      ])
    );

    const updateRes = await updateDelivery(
      rJson(`/api/ticket-deliveries/${delivery.id}`, "PATCH", { status: "Sent" }, token),
      { params: Promise.resolve({ deliveryId: delivery.id }) }
    );
    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.status).toBe("Sent");
    expect(updated.sentAt).toEqual(expect.any(String));
  });
});
