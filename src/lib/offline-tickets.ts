import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Booking } from "./types";

const STORAGE_KEY = "ecobus-offline-tickets";
const MAX_CACHED_TICKETS = 10;

export type CachedTicket = {
  booking: Booking;
  qrCodeUrl: string;
  cachedAt: string;
};

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

async function readCache(): Promise<CachedTicket[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEY });
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as CachedTicket[]) : [];
  } catch {
    return [];
  }
}

async function writeCache(tickets: CachedTicket[]): Promise<void> {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(tickets) });
}

export async function cacheTicket(booking: Booking, qrCodeUrl: string): Promise<void> {
  if (!isNativePlatform()) return;

  const existing = await readCache();
  const withoutCurrent = existing.filter((entry) => entry.booking.id !== booking.id);
  const updated = [
    { booking, qrCodeUrl, cachedAt: new Date().toISOString() },
    ...withoutCurrent,
  ].slice(0, MAX_CACHED_TICKETS);

  await writeCache(updated);
}

export async function getCachedTicket(bookingId: string): Promise<CachedTicket | null> {
  if (!isNativePlatform()) return null;

  const existing = await readCache();
  return existing.find((entry) => entry.booking.id === bookingId) ?? null;
}

export async function getCachedTickets(): Promise<CachedTicket[]> {
  if (!isNativePlatform()) return [];
  return readCache();
}

export async function removeCachedTicket(bookingId: string): Promise<void> {
  if (!isNativePlatform()) return;

  const existing = await readCache();
  await writeCache(existing.filter((entry) => entry.booking.id !== bookingId));
}
