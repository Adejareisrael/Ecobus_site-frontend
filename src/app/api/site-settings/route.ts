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

function sanitizeSettings(input: Partial<SiteSettings>): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...input,
    popularRoutes:
      Array.isArray(input.popularRoutes) && input.popularRoutes.length > 0
        ? input.popularRoutes.map(String).slice(0, 8)
        : defaultSiteSettings.popularRoutes,
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
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
