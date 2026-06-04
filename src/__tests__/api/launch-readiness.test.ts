import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET as getMe, PATCH as patchMe } from "@/app/api/users/me/route";
import { POST as createTerminal } from "@/app/api/terminals/route";
import {
  DELETE as deleteTerminal,
  PATCH as patchTerminal,
} from "@/app/api/terminals/[terminalId]/route";
import { GET as getSeats } from "@/app/api/trips/[tripId]/seats/route";
import {
  createAdmin,
  createUser,
  getRequest,
  jsonRequest,
} from "../test-utils";

function asNext(req: Request): NextRequest {
  return req as unknown as NextRequest;
}

function params(terminalId: string) {
  return { params: Promise.resolve({ terminalId }) };
}

function tripParams(tripId: string) {
  return { params: Promise.resolve({ tripId }) };
}

describe("customer profile API", () => {
  it("returns the authenticated customer profile", async () => {
    const { user, token } = await createUser({
      name: "Profile User",
      email: "profile@test.com",
    });

    const res = await getMe(asNext(getRequest("/api/users/me", token)));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(user.id);
    expect(data.email).toBe("profile@test.com");
  });

  it("updates profile details and returns a refreshed token", async () => {
    const { token } = await createUser({ email: "profile-edit@test.com" });

    const res = await patchMe(
      asNext(
        jsonRequest(
          "/api/users/me",
          "PATCH",
          { name: "Edited User", email: "EDITED@test.com", phone: "080 123 4567" },
          token
        )
      )
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.name).toBe("Edited User");
    expect(data.user.email).toBe("edited@test.com");
    expect(data.user.phone).toBe("080 123 4567");
  });

  it("rejects duplicate profile emails", async () => {
    await createUser({ email: "taken@test.com" });
    const { token } = await createUser({ email: "owner@test.com" });

    const res = await patchMe(
      asNext(
        jsonRequest(
          "/api/users/me",
          "PATCH",
          { name: "Owner", email: "taken@test.com" },
          token
        )
      )
    );

    expect(res.status).toBe(409);
  });
});

describe("terminal admin API", () => {
  it("blocks terminal creation without an admin token", async () => {
    const res = await createTerminal(
      asNext(
        jsonRequest("/api/terminals", "POST", {
          name: "No Auth",
          city: "Lagos",
          state: "Lagos",
        })
      )
    );

    expect(res.status).toBe(401);
  });

  it("allows admins to create, update, and delete unused terminals", async () => {
    const { token } = await createAdmin();
    const createRes = await createTerminal(
      asNext(
        jsonRequest(
          "/api/terminals",
          "POST",
          { id: "test-terminal", name: "Test Terminal", city: "Lagos", state: "Lagos" },
          token
        )
      )
    );
    const created = await createRes.json();

    const updateRes = await patchTerminal(
      asNext(
        jsonRequest(
          "/api/terminals/test-terminal",
          "PATCH",
          { name: "Updated Terminal", city: "Benin", state: "Edo" },
          token
        )
      ),
      params(created.id)
    );
    const updated = await updateRes.json();

    const deleteRes = await deleteTerminal(
      asNext(getRequest("/api/terminals/test-terminal", token)),
      params(created.id)
    );

    expect(createRes.status).toBe(201);
    expect(updateRes.status).toBe(200);
    expect(updated.name).toBe("Updated Terminal");
    expect(deleteRes.status).toBe(200);
  });

  it("prevents deleting terminals assigned to trips", async () => {
    const { token } = await createAdmin();
    const terminal = await prisma.terminal.create({
      data: { id: "lagos-fadeyi", name: "Fadeyi", city: "Lagos", state: "Lagos" },
    });

    const res = await deleteTerminal(
      asNext(getRequest(`/api/terminals/${terminal.id}`, token)),
      params(terminal.id)
    );

    expect(res.status).toBe(409);
  });
});

describe("trip seat availability API", () => {
  it("marks seats unavailable only on the matching travel date", async () => {
    const { user } = await createUser({ email: "seats@test.com" });
    await prisma.booking.create({
      data: {
        reference: "ECO-SEAT-DATE",
        paystackRef: "seat-date-ref",
        tripId: "trip-001",
        travelDate: "2026-05-27",
        routeLabel: "Lagos (Fadeyi) → Benin",
        departureTime: "08:00",
        busType: "Toyota",
        price: 15000,
        seatsJson: JSON.stringify(["1"]),
        passengerName: "Seat User",
        passengerPhone: "08012345678",
        passengerEmail: "seats@test.com",
        userId: user.id,
        status: "Confirmed",
      },
    });

    const bookedDateRes = await getSeats(
      new NextRequest("http://localhost:3000/api/trips/trip-001/seats?date=2026-05-27"),
      tripParams("trip-001")
    );
    const otherDateRes = await getSeats(
      new NextRequest("http://localhost:3000/api/trips/trip-001/seats?date=2026-05-28"),
      tripParams("trip-001")
    );

    const bookedDateSeats = await bookedDateRes.json();
    const otherDateSeats = await otherDateRes.json();

    expect(bookedDateRes.status).toBe(200);
    expect(bookedDateSeats.find((seat: { label: string }) => seat.label === "1")?.isAvailable).toBe(false);
    expect(otherDateSeats.find((seat: { label: string }) => seat.label === "1")?.isAvailable).toBe(true);
  });
});
