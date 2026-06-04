import { beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { trips } from "@/lib/mock-data";
import { defaultSiteSettings } from "@/lib/site-settings-storage";
import { busLayoutToDbInput, defaultToyotaLayout } from "@/lib/bus-layouts";
import { resetRateLimitsForTests } from "@/lib/rate-limit";

// Wipe tables before every test so each test starts from a clean slate
beforeEach(async () => {
  resetRateLimitsForTests();
  await prisma.passwordResetToken.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketDelivery.deleteMany();
  await prisma.user.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.trip.deleteMany({
    where: { id: { notIn: trips.map((trip) => trip.id) } },
  });
  await prisma.busLayout.upsert({
    where: { id: defaultToyotaLayout.id },
    update: busLayoutToDbInput(defaultToyotaLayout),
    create: {
      id: defaultToyotaLayout.id,
      ...busLayoutToDbInput(defaultToyotaLayout),
    },
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
  await prisma.busLayout.deleteMany({
    where: { id: { not: defaultToyotaLayout.id } },
  });
  const { popularRoutes, ...settings } = defaultSiteSettings;
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {
      ...settings,
      popularRoutesJson: JSON.stringify(popularRoutes),
    },
    create: {
      id: "site",
      ...settings,
      popularRoutesJson: JSON.stringify(popularRoutes),
    },
  });
});

// Restore any globals (fetch stubs etc.) stubbed during a test
afterEach(() => {
  resetRateLimitsForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
