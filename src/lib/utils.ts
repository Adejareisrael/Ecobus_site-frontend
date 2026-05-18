import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 💰 Format Nigerian Naira safely
 */
export function formatNaira(amount?: number | null) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₦0";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 🎫 Calculate booking total safely
 */
export function getBookingTotal(
  price?: number | null,
  seatsCount?: number | null
) {
  const safePrice = typeof price === "number" ? price : 0;
  const safeSeats = typeof seatsCount === "number" ? seatsCount : 0;

  return safePrice * safeSeats;
}