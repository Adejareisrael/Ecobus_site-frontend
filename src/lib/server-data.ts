import { prisma } from "./prisma";
import { defaultSiteSettings, SiteSettings } from "./site-settings-storage";
import { Terminal, Trip } from "./types";

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

type DbTrip = {
  id: string;
  departureTerminalId: string;
  destinationTerminalId: string;
  routeLabel: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  busType: string;
  busLayoutId: string | null;
  amenitiesJson?: string | null;
  isActive: boolean;
};

type DbSettings = {
  heroTitlePrefix: string;
  heroBrand: string;
  heroDescription: string;
  heroEyebrow: string;
  heroCardTitle: string;
  heroCardDescription: string;
  popularRoutesJson: string;
  popularRouteImagesJson?: string | null;
  footerDescription: string;
  supportText: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  facebookHandle: string;
  instagramHandle: string;
  xHandle: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  responseTimeText: string;
  bottomNote: string;
};

export function formatTrip(trip: DbTrip): Trip {
  return {
    id: trip.id,
    departureTerminalId: trip.departureTerminalId,
    destinationTerminalId: trip.destinationTerminalId,
    routeLabel: trip.routeLabel,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    price: trip.price,
    availableSeats: trip.availableSeats,
    busType: trip.busType as Trip["busType"],
    busLayoutId: trip.busLayoutId,
    amenities: parseStringArray(trip.amenitiesJson),
    isActive: trip.isActive,
  };
}

export function formatSettings(settings: DbSettings | null): SiteSettings {
  if (!settings) return defaultSiteSettings;
  const popularRouteImages = parseStringArray(settings.popularRouteImagesJson);

  return {
    heroTitlePrefix: settings.heroTitlePrefix,
    heroBrand: settings.heroBrand,
    heroDescription: settings.heroDescription,
    heroEyebrow: settings.heroEyebrow,
    heroCardTitle: settings.heroCardTitle,
    heroCardDescription: settings.heroCardDescription,
    popularRoutes: JSON.parse(settings.popularRoutesJson) as string[],
    popularRouteImages: popularRouteImages.length
      ? popularRouteImages
      : defaultSiteSettings.popularRouteImages,
    footerDescription: settings.footerDescription,
    supportText: settings.supportText,
    whatsappNumber: settings.whatsappNumber,
    whatsappMessage: settings.whatsappMessage,
    email: settings.email,
    facebookHandle: settings.facebookHandle,
    instagramHandle: settings.instagramHandle,
    xHandle: settings.xHandle,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    xUrl: settings.xUrl,
    responseTimeText: settings.responseTimeText,
    bottomNote: settings.bottomNote,
  };
}

export async function getDbTerminals(): Promise<Terminal[]> {
  const terminals = await prisma.terminal.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });

  return terminals.map((terminal) => ({
    ...terminal,
    facilities: parseStringArray(terminal.facilitiesJson),
  }));
}

export async function getDbTerminalById(terminalId: string): Promise<Terminal | null> {
  const terminal = await prisma.terminal.findUnique({ where: { id: terminalId } });
  if (!terminal) return null;

  return {
    ...terminal,
    facilities: parseStringArray(terminal.facilitiesJson),
  };
}

export async function getDbTrips(params: {
  from?: string;
  to?: string;
  includeInactive?: boolean;
} = {}): Promise<Trip[]> {
  const trips = await prisma.trip.findMany({
    where: {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.from ? { departureTerminalId: params.from } : {}),
      ...(params.to ? { destinationTerminalId: params.to } : {}),
    },
    orderBy: [{ departureTime: "asc" }, { routeLabel: "asc" }],
  });

  return trips.map(formatTrip);
}

export async function getDbTripById(tripId: string): Promise<Trip | null> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  return trip ? formatTrip(trip) : null;
}

export async function getDbSiteSettings(): Promise<SiteSettings> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  return formatSettings(settings);
}

export function settingsToDbInput(settings: SiteSettings) {
  const { popularRoutes, popularRouteImages, ...fields } = settings;
  return {
    ...fields,
    popularRoutesJson: JSON.stringify(popularRoutes),
    popularRouteImagesJson: JSON.stringify(popularRouteImages),
  };
}
