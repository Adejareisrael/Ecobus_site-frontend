import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppliedPromo, Booking, Passenger, Trip } from "@/lib/types";

type PaymentMethod = "Card" | "Transfer";

type BookingState = {
  selectedTrip: Trip | null;
  selectedTravelDate: string;
  selectedSeats: string[];
  passenger: Passenger;
  paymentMethod: PaymentMethod;
  appliedPromo: AppliedPromo | null;
  lastBooking: Booking | null;

  setTrip: (trip: Trip | null) => void;
  setTravelDate: (date: string) => void;
  toggleSeat: (seat: string) => void;
  clearSeats: () => void;
  setPassenger: (passenger: Partial<Passenger>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
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
    (set) => ({
      selectedTrip: null,
      selectedTravelDate: "",
      selectedSeats: [],
      passenger: emptyPassenger,
      paymentMethod: "Card",
      appliedPromo: null,
      lastBooking: null,

      setTrip: (trip) =>
        set({
          selectedTrip: trip,
          selectedSeats: [],
          appliedPromo: null,
        }),
      setTravelDate: (date) => set({ selectedTravelDate: date }),

      toggleSeat: (seat) =>
        set((state) => ({
          selectedSeats: state.selectedSeats.includes(seat)
            ? state.selectedSeats.filter((s) => s !== seat)
            : [...state.selectedSeats, seat],
          appliedPromo: null,
        })),

      clearSeats: () => set({ selectedSeats: [], appliedPromo: null }),

      setPassenger: (passenger) =>
        set((state) => ({
          passenger: {
            ...state.passenger,
            ...passenger,
          },
        })),

      setPaymentMethod: (method) =>
        set({ paymentMethod: method }),

      setAppliedPromo: (promo) =>
        set({ appliedPromo: promo }),

      setLastBooking: (booking) =>
        set({ lastBooking: booking }),

      resetFlow: () =>
        set({
          selectedTrip: null,
          selectedTravelDate: "",
          selectedSeats: [],
          passenger: emptyPassenger,
          paymentMethod: "Card",
          appliedPromo: null,
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
