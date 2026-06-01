export type ParsedTicketQr = {
  bookingId?: string;
  reference?: string;
  confirmationPath?: string;
  raw: string;
};

export type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect(video: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

export function parseTicketQr(rawValue: string): ParsedTicketQr {
  const raw = rawValue.trim();

  try {
    const parsed = JSON.parse(raw) as {
      bookingId?: string;
      reference?: string;
      ticket?: string;
    };

    if (parsed.ticket) {
      const fromTicket = parseTicketUrl(parsed.ticket);
      return {
        raw,
        bookingId: parsed.bookingId ?? fromTicket.bookingId,
        reference: parsed.reference ?? fromTicket.reference,
        confirmationPath: fromTicket.confirmationPath,
      };
    }

    return {
      raw,
      bookingId: parsed.bookingId,
      reference: parsed.reference,
    };
  } catch {
    return parseTicketUrl(raw);
  }
}

function parseTicketUrl(value: string): ParsedTicketQr {
  try {
    const url = new URL(value);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const confirmationIndex = pathParts.indexOf("confirmation");
    const bookingId =
      url.searchParams.get("bookingId") ??
      (confirmationIndex >= 0 ? pathParts[confirmationIndex + 1] : undefined);
    const reference =
      url.searchParams.get("reference") ?? url.searchParams.get("ref") ?? undefined;

    return {
      raw: value,
      bookingId: bookingId || undefined,
      reference: reference || undefined,
      confirmationPath:
        confirmationIndex >= 0 && bookingId
          ? `/confirmation/${bookingId}${url.search}`
          : undefined,
    };
  } catch {
    return {
      raw: value,
      reference: value || undefined,
    };
  }
}
