import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { trips } from "../src/lib/mock-data";
import { terminals } from "../src/lib/terminals";
import { defaultSiteSettings } from "../src/lib/site-settings-storage";
import { busLayoutToDbInput, defaultToyotaLayout } from "../src/lib/bus-layouts";

const { popularRoutes, popularRouteImages, ...siteSettingsFields } = defaultSiteSettings;

async function main() {
  for (const terminal of terminals) {
    await prisma.terminal.upsert({
      where: { id: terminal.id },
      update: {},
      create: {
        id: terminal.id,
        name: terminal.name,
        city: terminal.city,
        state: terminal.state,
        address: terminal.address ?? "",
        phone: terminal.phone ?? "",
        hours: terminal.hours ?? "",
        mapUrl: terminal.mapUrl ?? "",
        facilitiesJson: JSON.stringify(terminal.facilities ?? []),
      },
    });
  }

  await prisma.busLayout.upsert({
    where: { id: defaultToyotaLayout.id },
    update: {},
    create: {
      id: defaultToyotaLayout.id,
      ...busLayoutToDbInput(defaultToyotaLayout),
    },
  });

  for (const trip of trips) {
    await prisma.trip.upsert({
      where: { id: trip.id },
      update: {},
      create: {
        id: trip.id,
        departureTerminalId: trip.departureTerminalId,
        destinationTerminalId: trip.destinationTerminalId,
        routeLabel: trip.routeLabel,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        price: trip.price,
        availableSeats: trip.availableSeats,
        busType: trip.busType,
        busLayoutId: trip.busLayoutId ?? null,
        amenitiesJson: JSON.stringify(trip.amenities ?? []),
        isActive: trip.isActive ?? true,
      },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      ...siteSettingsFields,
      popularRoutesJson: JSON.stringify(popularRoutes),
      popularRouteImagesJson: JSON.stringify(popularRouteImages),
    },
  });

  const adminPw = await bcrypt.hash("Admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@ecobus.ng" },
    update: { role: "admin" },
    create: { name: "Admin", email: "admin@ecobus.ng", password: adminPw, role: "admin" },
  });

  const demoPw = await bcrypt.hash("Demo1234", 10);
  await prisma.user.upsert({
    where: { email: "demo@ecobus.ng" },
    update: {},
    create: { name: "Demo User", email: "demo@ecobus.ng", password: demoPw },
  });

  console.log("Seeded missing defaults without deleting production data.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
