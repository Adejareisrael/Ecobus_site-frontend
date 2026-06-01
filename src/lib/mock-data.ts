import { Booking, Seat, Trip } from "./types";
import {
  generateGenericSeats,
  generateToyotaSeats,
  toyotaLayoutId,
} from "./bus-layouts";

/**
 * 🚌 Trips
 */
export const trips: Trip[] = [
  {
    id: "trip-001",
    departureTerminalId: "lagos-fadeyi",
    destinationTerminalId: "benin-idokpa",

    departureTime: "07:00",
    arrivalTime: "11:30",

    price: 15000,
    availableSeats: 14,

    busType: "Toyota",
    busLayoutId: toyotaLayoutId,

    routeLabel: "Lagos Fadeyi -> Benin Idokpa",
  },

  {
    id: "trip-002",
    departureTerminalId: "lagos-ajah",
    destinationTerminalId: "onitsha-ukumango",

    departureTime: "08:00",
    arrivalTime: "15:00",

    price: 24000,
    availableSeats: 9,

    busType: "Executive",

    routeLabel: "Lagos Ajah -> Onitsha Ukumango",
  },

  {
    id: "trip-003",
    departureTerminalId: "benin-ramat-park",
    destinationTerminalId: "lagos-fadeyi",

    departureTime: "14:00",
    arrivalTime: "18:20",

    price: 14000,
    availableSeats: 24,

    busType: "Standard",

    routeLabel: "Benin Ramat Park -> Lagos Fadeyi",
  },

  {
    id: "trip-004",
    departureTerminalId: "onitsha-ukumango",
    destinationTerminalId: "lagos-ajah",

    departureTime: "08:00",
    arrivalTime: "16:40",

    price: 26000,
    availableSeats: 14,

    busType: "Toyota",
    busLayoutId: toyotaLayoutId,

    routeLabel: "Onitsha Ukumango -> Lagos Ajah",
  },
];

/**
 * 🎫 Mock bookings
 */
export const bookings: Booking[] = [];

/**
 * 💺 Deterministic seat generator
 */
export function generateSeats(
  busType: Trip["busType"],
  availableSeats = 14
): Seat[] {
  if (busType === "Toyota" || busType === "AC") return generateToyotaSeats();
  return generateGenericSeats(availableSeats);
}
