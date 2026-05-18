import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

// ─── Request builders ────────────────────────────────────────────────────────

export function jsonRequest(path: string, method: string, body: unknown, token?: string): Request {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function getRequest(path: string, token?: string): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

export async function createUser(overrides?: {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}) {
  const raw = overrides?.password ?? "Password123";
  const hashed = await bcrypt.hash(raw, 10);
  const user = await prisma.user.create({
    data: {
      name: overrides?.name ?? "Test User",
      email: overrides?.email ?? `user-${Date.now()}@ecobus.ng`,
      password: hashed,
      role: overrides?.role ?? "customer",
    },
  });
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  return { user, token, rawPassword: raw };
}

export async function createAdmin() {
  return createUser({ name: "Admin", email: "admin@ecobus.ng", role: "admin" });
}

export async function createBooking(userId: string | null, paystackRef?: string) {
  return prisma.booking.create({
    data: {
      reference: `ECO-${crypto.randomUUID()}`,
      paystackRef: paystackRef ?? `ps-ref-${crypto.randomUUID()}`,
      tripId: "trip-1",
      routeLabel: "Lagos → Abuja",
      departureTime: "08:00 AM",
      busType: "AC",
      price: 5000,
      seatsJson: JSON.stringify(["A1", "A2"]),
      passengerName: "John Doe",
      passengerPhone: "08012345678",
      passengerEmail: "john@test.com",
      userId,
      status: "Confirmed",
    },
  });
}

// ─── Paystack mock helpers ───────────────────────────────────────────────────

export const TEST_TRIP = {
  id: "trip-1",
  routeLabel: "Lagos → Abuja",
  departureTime: "08:00 AM",
  arrivalTime: "03:00 PM",
  busType: "AC" as const,
  price: 5000,
  availableSeats: 10,
  departureTerminalId: "terminal-1",
  destinationTerminalId: "terminal-2",
};

export const TEST_SEATS = ["A1", "A2"];

export const TEST_PASSENGER = {
  fullName: "John Doe",
  phone: "08012345678",
  email: "john@test.com",
};

// 2 seats × ₦5000 × 100 kobo = 1,000,000
export const EXPECTED_KOBO = TEST_TRIP.price * TEST_SEATS.length * 100;

export function stubPaystackSuccess(reference: string, amount = EXPECTED_KOBO) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: true,
          message: "Verification successful",
          data: { status: "success", reference, amount, currency: "NGN" },
        })
      )
    )
  );
}

export function stubPaystackFailed() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: false,
          message: "Transaction not found",
          data: { status: "failed", reference: "", amount: 0, currency: "NGN" },
        })
      )
    )
  );
}
