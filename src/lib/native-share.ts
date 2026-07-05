import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export type ShareTicketInput = {
  title: string;
  text: string;
  url: string;
};

export type ShareResult = { shared: boolean };

export async function shareTicket(input: ShareTicketInput): Promise<ShareResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share(input);
      return { shared: true };
    } catch {
      // User cancelled the native share sheet — not an error.
      return { shared: false };
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(input);
      return { shared: true };
    } catch {
      return { shared: false };
    }
  }

  return { shared: false };
}
