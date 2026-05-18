import { beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Wipe tables before every test so each test starts from a clean slate
beforeEach(async () => {
  await prisma.booking.deleteMany();
  await prisma.user.deleteMany();
});

// Restore any globals (fetch stubs etc.) stubbed during a test
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
