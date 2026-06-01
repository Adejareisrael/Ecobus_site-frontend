import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { trips } from "../src/lib/mock-data";
import { terminals } from "../src/lib/terminals";
import { defaultSiteSettings } from "../src/lib/site-settings-storage";
import { busLayoutToDbInput, defaultToyotaLayout } from "../src/lib/bus-layouts";

const dbPath = path.join(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });
const { popularRoutes, ...siteSettingsFields } = defaultSiteSettings;

async function main() {
  await prisma.booking.deleteMany();
  await prisma.user.deleteMany();

  for (const terminal of terminals) {
    await prisma.terminal.upsert({
      where: { id: terminal.id },
      update: {
        name: terminal.name,
        city: terminal.city,
        state: terminal.state,
      },
      create: terminal,
    });
  }

  await prisma.busLayout.upsert({
    where: { id: defaultToyotaLayout.id },
    update: busLayoutToDbInput(defaultToyotaLayout),
    create: {
      id: defaultToyotaLayout.id,
      ...busLayoutToDbInput(defaultToyotaLayout),
    },
  });

  await prisma.trip.deleteMany({
    where: { id: { notIn: trips.map((trip) => trip.id) } },
  });

  for (const trip of trips) {
    await prisma.trip.upsert({
      where: { id: trip.id },
      update: {
        departureTerminalId: trip.departureTerminalId,
        destinationTerminalId: trip.destinationTerminalId,
        routeLabel: trip.routeLabel,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        price: trip.price,
        availableSeats: trip.availableSeats,
        busType: trip.busType,
        busLayoutId: trip.busLayoutId ?? null,
        isActive: trip.isActive ?? true,
      },
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
        isActive: trip.isActive ?? true,
      },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {
      ...siteSettingsFields,
      popularRoutesJson: JSON.stringify(popularRoutes),
    },
    create: {
      id: "site",
      ...siteSettingsFields,
      popularRoutesJson: JSON.stringify(popularRoutes),
    },
  });

  const adminPw = await bcrypt.hash("Admin123", 10);
  await prisma.user.create({
    data: { name: "Admin", email: "admin@ecobus.ng", password: adminPw, role: "admin" },
  });

  const demoPw = await bcrypt.hash("Demo1234", 10);
  await prisma.user.create({
    data: { name: "Demo User", email: "demo@ecobus.ng", password: demoPw },
  });

  console.log("✅ Seeded: admin@ecobus.ng / Admin123  |  demo@ecobus.ng / Demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
