import { trips as defaultTrips } from "./mock-data";
import { Trip } from "./types";

export const TRIP_STORAGE_KEY = "ecobus-admin-trips";

export function getSavedTrips(): Trip[] {
  if (typeof window === "undefined") return defaultTrips;

  const savedTrips = window.localStorage.getItem(TRIP_STORAGE_KEY);
  if (!savedTrips) return defaultTrips;

  try {
    return JSON.parse(savedTrips) as Trip[];
  } catch {
    window.localStorage.removeItem(TRIP_STORAGE_KEY);
    return defaultTrips;
  }
}

export function saveTrips(trips: Trip[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trips));
}

export function clearSavedTrips() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TRIP_STORAGE_KEY);
}

export function filterTrips(
  trips: Trip[],
  params: { from?: string; to?: string }
) {
  const { from, to } = params;

  return trips.filter((trip) => {
    const matchesFrom = from ? trip.departureTerminalId === from : true;
    const matchesTo = to ? trip.destinationTerminalId === to : true;

    return matchesFrom && matchesTo;
  });
}
