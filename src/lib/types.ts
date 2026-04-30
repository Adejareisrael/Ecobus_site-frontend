export type Terminal = {
  id: string;
  name: string;
  city: string;
};

/**
 * 🚌 Trip model
 * Uses terminal IDs instead of raw strings for backend compatibility
 */
export type Trip = {
  id: string;

  departureTerminalId: string;
  destinationTerminalId: string;

  departureTime: string;
  arrivalTime: string;

  price: number;

  availableSeats: number;

  busType: "AC" | "Executive" | "Standard";

  routeLabel: string;
};

/**
 * 💺 Seat model (frontend + UI rendering friendly)
 */
export type Seat = {
  id: string;
  label: string;
  isAvailable: boolean;
  row: number;
  column: number;
};

/**
 * 👤 Passenger info
 */
export type Passenger = {
  fullName: string;
  phone: string;
  email: string;
};

/**
 * 💳 Booking status (expanded for real-world systems)
 */
export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Cancelled"
  | "Failed"
  | "Refunded";

/**
 * 🎫 Booking model
 */
export type Booking = {
  id: string;
  reference: string;

  trip: Trip;

  seats: string[];

  passenger: Passenger;

  paymentMethod: "Card" | "Transfer";

  createdAt: string;

  status: BookingStatus;
};