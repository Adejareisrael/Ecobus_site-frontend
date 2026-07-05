import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  defaultSiteSettings,
  SiteSettings,
} from "@/lib/site-settings-storage";
import {
  getDbSiteSettings,
  settingsToDbInput,
} from "@/lib/server-data";
import { isAuthResponse, requireAdmin } from "@/lib/api-auth";

// Route images must be uploaded via /api/site-settings/upload-image and referenced
// by URL here — this cap blocks base64 data URLs from being written to the DB directly.
const MAX_IMAGE_URL_LENGTH = 2048;

function sanitizeSettings(input: Partial<SiteSettings>): SiteSettings {
  const popularRoutes =
    Array.isArray(input.popularRoutes) && input.popularRoutes.length > 0
      ? input.popularRoutes.map(String).slice(0, 8)
      : defaultSiteSettings.popularRoutes;

  const popularRouteImages =
    Array.isArray(input.popularRouteImages) && input.popularRouteImages.length > 0
      ? popularRoutes.map((_, index) => {
          const candidate = String(input.popularRouteImages?.[index] || "").trim();
          const fallback =
            defaultSiteSettings.popularRouteImages[index] ||
            defaultSiteSettings.popularRouteImages[0];

          return candidate && candidate.length <= MAX_IMAGE_URL_LENGTH
            ? candidate
            : fallback;
        })
      : popularRoutes.map(
          (_, index) =>
            defaultSiteSettings.popularRouteImages[index] ||
            defaultSiteSettings.popularRouteImages[0]
        );

  return {
    ...defaultSiteSettings,
    ...input,
    popularRoutes,
    popularRouteImages,
  };
}

export async function GET() {
  const settings = await getDbSiteSettings();
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const settings = sanitizeSettings((await req.json()) as Partial<SiteSettings>);
    const updated = await prisma.siteSettings.upsert({
      where: { id: "site" },
      update: settingsToDbInput(settings),
      create: {
        id: "site",
        ...settingsToDbInput(settings),
      },
    });

    return NextResponse.json(
      {
        ...settings,
        popularRoutes: JSON.parse(updated.popularRoutesJson) as string[],
        popularRouteImages: JSON.parse(updated.popularRouteImagesJson) as string[],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAuthResponse(admin)) return admin;

    const reset = await prisma.siteSettings.upsert({
      where: { id: "site" },
      update: settingsToDbInput(defaultSiteSettings),
      create: {
        id: "site",
        ...settingsToDbInput(defaultSiteSettings),
      },
    });

    return NextResponse.json(
      {
        ...defaultSiteSettings,
        popularRoutes: JSON.parse(reset.popularRoutesJson) as string[],
        popularRouteImages: JSON.parse(reset.popularRouteImagesJson) as string[],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
