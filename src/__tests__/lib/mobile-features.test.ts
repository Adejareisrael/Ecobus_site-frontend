import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Booking } from "@/lib/types";

const preferencesStore = new Map<string, string>();

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => true) },
}));

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: preferencesStore.get(key) ?? null,
    })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      preferencesStore.set(key, value);
    }),
  },
}));

const shareMock = vi.fn();
vi.mock("@capacitor/share", () => ({
  Share: { share: shareMock },
}));

const nativeSignInWithGoogle = vi.fn();
const nativeGetIdToken = vi.fn();
vi.mock("@capacitor-firebase/authentication", () => ({
  FirebaseAuthentication: {
    signInWithGoogle: (...args: unknown[]) => nativeSignInWithGoogle(...args),
    getIdToken: (...args: unknown[]) => nativeGetIdToken(...args),
  },
}));

const webSignInWithPopup = vi.fn();
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: (...args: unknown[]) => webSignInWithPopup(...args),
}));

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: overrides.id ?? "booking-1",
    reference: "ECO-100001",
    trip: {
      id: "trip-001",
      departureTerminalId: "lagos-fadeyi",
      destinationTerminalId: "benin-idokpa",
      departureTime: "07:00",
      arrivalTime: "11:30",
      price: 15000,
      availableSeats: 14,
      busType: "Toyota",
      routeLabel: "Lagos Fadeyi -> Benin Idokpa",
    },
    travelDate: "2026-08-01",
    seats: ["1", "2"],
    passenger: { fullName: "Test Passenger", phone: "08000000000", email: "test@ecobus.ng" },
    paymentMethod: "Card",
    discountAmount: 0,
    createdAt: new Date().toISOString(),
    status: "Confirmed",
    ...overrides,
  };
}

describe("offline-tickets", () => {
  beforeEach(() => {
    preferencesStore.clear();
    vi.resetModules();
  });

  it("does nothing on non-native platforms", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const { cacheTicket, getCachedTicket, getCachedTickets } = await import(
      "@/lib/offline-tickets"
    );

    await cacheTicket(makeBooking(), "data:image/png;base64,abc");
    expect(await getCachedTicket("booking-1")).toBeNull();
    expect(await getCachedTickets()).toEqual([]);
  });

  it("caches and retrieves a ticket on native platforms", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const { cacheTicket, getCachedTicket } = await import("@/lib/offline-tickets");

    await cacheTicket(makeBooking(), "data:image/png;base64,abc");
    const cached = await getCachedTicket("booking-1");

    expect(cached?.booking.reference).toBe("ECO-100001");
    expect(cached?.qrCodeUrl).toBe("data:image/png;base64,abc");
  });

  it("deduplicates by booking id instead of storing duplicates", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const { cacheTicket, getCachedTickets } = await import("@/lib/offline-tickets");

    await cacheTicket(makeBooking({ id: "booking-1" }), "qr-v1");
    await cacheTicket(makeBooking({ id: "booking-1" }), "qr-v2");

    const all = await getCachedTickets();
    expect(all).toHaveLength(1);
    expect(all[0].qrCodeUrl).toBe("qr-v2");
  });

  it("caps cached tickets at 10, keeping the most recent first", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const { cacheTicket, getCachedTickets } = await import("@/lib/offline-tickets");

    for (let i = 0; i < 12; i += 1) {
      await cacheTicket(makeBooking({ id: `booking-${i}` }), `qr-${i}`);
    }

    const all = await getCachedTickets();
    expect(all).toHaveLength(10);
    expect(all[0].booking.id).toBe("booking-11");
    expect(all.some((entry) => entry.booking.id === "booking-0")).toBe(false);
  });

  it("removes a cached ticket", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const { cacheTicket, removeCachedTicket, getCachedTicket } = await import(
      "@/lib/offline-tickets"
    );

    await cacheTicket(makeBooking(), "qr-1");
    await removeCachedTicket("booking-1");

    expect(await getCachedTicket("booking-1")).toBeNull();
  });
});

describe("native-share", () => {
  beforeEach(() => {
    vi.resetModules();
    shareMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the native Share plugin when on a native platform", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    shareMock.mockResolvedValue(undefined);

    const { shareTicket } = await import("@/lib/native-share");
    const result = await shareTicket({ title: "t", text: "body", url: "https://x.test" });

    expect(shareMock).toHaveBeenCalledWith({ title: "t", text: "body", url: "https://x.test" });
    expect(result).toEqual({ shared: true });
  });

  it("treats a cancelled native share sheet as shared: false, not an error", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    shareMock.mockRejectedValue(new Error("Share canceled"));

    const { shareTicket } = await import("@/lib/native-share");
    const result = await shareTicket({ title: "t", text: "body", url: "https://x.test" });

    expect(result).toEqual({ shared: false });
  });

  it("falls back to the Web Share API on non-native platforms", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const webShare = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share: webShare });

    const { shareTicket } = await import("@/lib/native-share");
    const result = await shareTicket({ title: "t", text: "body", url: "https://x.test" });

    expect(webShare).toHaveBeenCalledWith({ title: "t", text: "body", url: "https://x.test" });
    expect(shareMock).not.toHaveBeenCalled();
    expect(result).toEqual({ shared: true });
  });

  it("returns shared: false when no share capability exists at all", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.stubGlobal("navigator", {});

    const { shareTicket } = await import("@/lib/native-share");
    const result = await shareTicket({ title: "t", text: "body", url: "https://x.test" });

    expect(result).toEqual({ shared: false });
  });
});

describe("firebase-client", () => {
  beforeEach(() => {
    vi.resetModules();
    nativeSignInWithGoogle.mockReset();
    nativeGetIdToken.mockReset();
    webSignInWithPopup.mockReset();
  });

  it("uses the native Google Sign-In SDK on a native platform, not the web popup", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    nativeSignInWithGoogle.mockResolvedValue({ user: {}, credential: null, additionalUserInfo: null });
    nativeGetIdToken.mockResolvedValue({ token: "native-firebase-id-token" });

    const { signInWithGoogle } = await import("@/lib/firebase-client");
    const result = await signInWithGoogle();

    expect(nativeSignInWithGoogle).toHaveBeenCalled();
    expect(webSignInWithPopup).not.toHaveBeenCalled();
    expect(result).toEqual({ idToken: "native-firebase-id-token" });
  });

  it("uses the web popup flow on non-native platforms, not the native SDK", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    webSignInWithPopup.mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue("web-firebase-id-token") },
    });

    const { signInWithGoogle } = await import("@/lib/firebase-client");
    const result = await signInWithGoogle();

    expect(webSignInWithPopup).toHaveBeenCalled();
    expect(nativeSignInWithGoogle).not.toHaveBeenCalled();
    expect(result).toEqual({ idToken: "web-firebase-id-token" });
  });
});
