export type Terminal = {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  hours?: string;
  mapUrl?: string;
  facilities?: string[];
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

  busType: string;
  busLayoutId?: string | null;
  amenities?: string[];
  isActive?: boolean;

  routeLabel: string;
};

export type BusLayout = {
  id: string;
  name: string;
  model: string;
  totalSeats: number;
  seats: Seat[];
  isDefault: boolean;
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
  travelDate: string;

  seats: string[];

  passenger: Passenger;

  paymentMethod: "Card" | "Transfer";
  promoCode?: string | null;
  discountAmount?: number;

  createdAt: string;

  status: BookingStatus;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
};

export type CharterRequest = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  pickup: string;
  destination: string;
  travelDate: string;
  returnDate?: string | null;
  passengers: number;
  vehicleType?: string | null;
  notes?: string | null;
  status: "New" | "Contacted" | "Quoted" | "Closed";
  adminNote?: string | null;
  createdAt: string;
};

export type BookingChangeRequest = {
  id: string;
  bookingId: string;
  reference?: string;
  requestType: "Reschedule" | "Cancel";
  preferredDate?: string | null;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string | null;
  createdAt: string;
};

export type PromoCode = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minSpend: number;
  maxUses?: number | null;
  usedCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
};

export type AppliedPromo = {
  code: string;
  discountAmount: number;
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
  description?: string | null;
};
