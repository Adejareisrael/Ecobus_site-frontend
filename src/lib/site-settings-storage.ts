export type SiteSettings = {
  heroTitlePrefix: string;
  heroBrand: string;
  heroDescription: string;
  heroEyebrow: string;
  heroCardTitle: string;
  heroCardDescription: string;
  popularRoutes: string[];
  popularRouteImages: string[];
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

export const SITE_SETTINGS_STORAGE_KEY = "ecobus-site-settings";

export const defaultSiteSettings: SiteSettings = {
  heroTitlePrefix: "Book scheduled bus trips with",
  heroBrand: "Ecobus",
  heroDescription:
    "Search fixed routes, compare departures, choose your seat, and complete your booking in a few simple steps.",
  heroEyebrow: "Travel smarter",
  heroCardTitle: "Comfort, reliability, and seat-based booking.",
  heroCardDescription:
    "Designed for scheduled intercity travel between terminals, not ride-hailing.",
  popularRoutes: [
    "Lagos (Fadeyi) -> Benin",
    "Lagos (Ajah) -> Abuja",
    "Benin -> Lagos (Ajah)",
    "Lagos -> Port Harcourt",
    "Auchi -> Ramat",
  ],
  popularRouteImages: [
    "/route-lagos-benin.jpg",
    "/route-lagos-abuja.jpg",
    "/route-benin-lagos.jpg",
    "/route-lagos-port-harcourt.jpg",
    "/route-auchi-ramat.jpg",
  ],
  footerDescription: "Scheduled intercity travel made simple across Nigeria.",
  supportText: "Need help with bookings or payments?",
  whatsappNumber: "2349133994004",
  whatsappMessage: "Hi Ecobus Support, I need help with my booking.",
  email: "info@ecobustransport.com",
  facebookHandle: "@Ecobus.ng",
  instagramHandle: "Ecobus_transport",
  xHandle: "Ecobustransport",
  facebookUrl: "https://facebook.com/Ecobus.ng",
  instagramUrl: "https://instagram.com/Ecobus_transport",
  xUrl: "https://x.com/Ecobustransport",
  responseTimeText: "Fastest response time, usually under 5 mins",
  bottomNote: "Built for intercity travel in Nigeria",
};

export function getSiteSettings(): SiteSettings {
  if (typeof window === "undefined") return defaultSiteSettings;

  const savedSettings = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
  if (!savedSettings) return defaultSiteSettings;

  try {
    return {
      ...defaultSiteSettings,
      ...(JSON.parse(savedSettings) as Partial<SiteSettings>),
    };
  } catch {
    window.localStorage.removeItem(SITE_SETTINGS_STORAGE_KEY);
    return defaultSiteSettings;
  }
}

export function saveSiteSettings(settings: SiteSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new StorageEvent("storage", { key: SITE_SETTINGS_STORAGE_KEY }));
}

export function clearSiteSettings() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SITE_SETTINGS_STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: SITE_SETTINGS_STORAGE_KEY }));
}
