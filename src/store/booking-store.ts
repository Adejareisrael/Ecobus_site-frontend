import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Booking, Passenger, Trip } from "@/lib/types";

type PaymentMethod = "Card" | "Transfer";

type BookingState = {
  selectedTrip: Trip | null;
  selectedSeats: string[];
  passenger: Passenger;
  paymentMethod: PaymentMethod;
  lastBooking: Booking | null;

  setTrip: (trip: Trip | null) => void;
  toggleSeat: (seat: string) => void;
  clearSeats: () => void;
  setPassenger: (passenger: Partial<Passenger>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setLastBooking: (booking: Booking | null) => void;
  resetFlow: () => void;
};

const emptyPassenger: Passenger = {
  fullName: "",
  phone: "",
  email: "",
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedTrip: null,
      selectedSeats: [],
      passenger: emptyPassenger,
      paymentMethod: "Card",
      lastBooking: null,

      setTrip: (trip) => set({ selectedTrip: trip }),

      toggleSeat: (seat) =>
        set((state) => ({
          selectedSeats: state.selectedSeats.includes(seat)
            ? state.selectedSeats.filter((s) => s !== seat)
            : [...state.selectedSeats, seat],
        })),

      clearSeats: () => set({ selectedSeats: [] }),

      setPassenger: (passenger) =>
        set((state) => ({
          passenger: {
            ...state.passenger,
            ...passenger,
          },
        })),

      setPaymentMethod: (method) =>
        set({ paymentMethod: method }),

      setLastBooking: (booking) =>
        set({ lastBooking: booking }),

      resetFlow: () =>
        set({
          selectedTrip: null,
          selectedSeats: [],
          passenger: emptyPassenger,
          paymentMethod: "Card",
        }),
    }),
    {
      name: "ecobus-booking",

      // 🔥 IMPORTANT: future-proofing
      version: 1,

      // optional: prevent SSR hydration weirdness later
      skipHydration: false,
    }
  )
);