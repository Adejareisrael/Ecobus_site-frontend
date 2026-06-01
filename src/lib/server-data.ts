import { prisma } from "./prisma";
import { defaultSiteSettings, SiteSettings } from "./site-settings-storage";
import { Terminal, Trip } from "./types";

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
    isActive: trip.isActive,
  };
}

export function formatSettings(settings: DbSettings | null): SiteSettings {
  if (!settings) return defaultSiteSettings;

  return {
    heroTitlePrefix: settings.heroTitlePrefix,
    heroBrand: settings.heroBrand,
    heroDescription: settings.heroDescription,
    heroEyebrow: settings.heroEyebrow,
    heroCardTitle: settings.heroCardTitle,
    heroCardDescription: settings.heroCardDescription,
    popularRoutes: JSON.parse(settings.popularRoutesJson) as string[],
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
  return prisma.terminal.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] });
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
  const { popularRoutes, ...fields } = settings;
  return {
    ...fields,
    popularRoutesJson: JSON.stringify(popularRoutes),
  };
}
