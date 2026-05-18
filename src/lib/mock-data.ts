import { Booking, Seat, Terminal, Trip } from "./types";

/**
 * 🏢 Terminals (stable reference data)
 */
export const terminals: Terminal[] = [
  { id: "lagos-jibowu", name: "Lagos (Jibowu)", city: "Lagos" },
  { id: "abuja", name: "Abuja", city: "Abuja" },
  { id: "benin", name: "Benin", city: "Benin" },
  { id: "ph", name: "Port Harcourt", city: "Port Harcourt" },
];

/**
 * 🚌 Trips (NOW aligned with updated types)
 */
export const trips: Trip[] = [
  {
    id: "trip-001",
    departureTerminalId: "lagos-jibowu",
    destinationTerminalId: "benin",
    departureTime: "07:00",
    arrivalTime: "11:30",
    price: 15000,
    availableSeats: 18,
    busType: "AC",
    routeLabel: "Lagos → Benin",
  },
  {
    id: "trip-002",
    departureTerminalId: "lagos-jibowu",
    destinationTerminalId: "abuja",
    departureTime: "08:30",
    arrivalTime: "17:00",
    price: 28000,
    availableSeats: 9,
    busType: "Executive",
    routeLabel: "Lagos → Abuja",
  },
  {
    id: "trip-003",
    departureTerminalId: "benin",
    destinationTerminalId: "lagos-jibowu",
    departureTime: "14:00",
    arrivalTime: "18:20",
    price: 14000,
    availableSeats: 24,
    busType: "Standard",
    routeLabel: "Benin → Lagos",
  },
  {
    id: "trip-004",
    departureTerminalId: "abuja",
    destinationTerminalId: "ph",
    departureTime: "09:00",
    arrivalTime: "16:40",
    price: 26000,
    availableSeats: 12,
    busType: "Executive",
    routeLabel: "Abuja → Port Harcourt",
  },
];

/**
 * 🎫 Bookings (in-memory mock DB)
 */
export const bookings: Booking[] = [];

/**
 * 💺 Deterministic seat generator (NO randomness)
 * This fixes unstable UI behavior
 */
export function generateSeats(busType: Trip["busType"]): Seat[] {
  let totalRows = 5;

  if (busType === "Executive") totalRows = 4;
  if (busType === "Standard") totalRows = 5;
  if (busType === "AC") totalRows = 5;

  const seats: Seat[] = [];

  // FRONT SEAT
  seats.push({
    id: "front-seat",
    label: "F1",
    isAvailable: true,
    row: 0,
    column: 2,
  });

  // deterministic availability function
  const isAvailable = (row: number, col: number) =>
    (row * 7 + col * 3) % 5 !== 0;

  for (let r = 1; r <= totalRows; r++) {
    const leftSeats = ["A", "B"];

    leftSeats.forEach((label, index) => {
      seats.push({
        id: `${r}${label}`,
        label: `${r}${label}`,
        isAvailable: isAvailable(r, index),
        row: r,
        column: index,
      });
    });

    seats.push({
      id: `${r}C`,
      label: `${r}C`,
      isAvailable: isAvailable(r, 2),
      row: r,
      column: 2,
    });
  }

  return seats;
}