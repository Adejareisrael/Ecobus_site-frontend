import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { withSeatLock } from "@/lib/seat-availability";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("withSeatLock", () => {
  it("serializes concurrent critical sections for the same trip + travel date", async () => {
    const events: string[] = [];

    const first = prisma.$transaction(async (tx) =>
      withSeatLock(tx, "trip-lock-test", "2026-09-01", async () => {
        events.push("first-start");
        await delay(200);
        events.push("first-end");
      })
    );

    // Give `first` a head start so it acquires the lock before `second` tries.
    await delay(20);

    const second = prisma.$transaction(async (tx) =>
      withSeatLock(tx, "trip-lock-test", "2026-09-01", async () => {
        events.push("second-start");
      })
    );

    await Promise.all([first, second]);

    expect(events).toEqual(["first-start", "first-end", "second-start"]);
  });

  it("does not serialize critical sections for different trip + travel date keys", async () => {
    const events: string[] = [];

    const first = prisma.$transaction(async (tx) =>
      withSeatLock(tx, "trip-a", "2026-09-01", async () => {
        events.push("a-start");
        await delay(150);
        events.push("a-end");
      })
    );

    await delay(20);

    const second = prisma.$transaction(async (tx) =>
      withSeatLock(tx, "trip-b", "2026-09-01", async () => {
        events.push("b-start");
      })
    );

    await Promise.all([first, second]);

    // An unrelated trip/date shouldn't be blocked by trip-a's lock, so
    // b-start should land while a is still mid-flight, not after a-end.
    expect(events.indexOf("b-start")).toBeLessThan(events.indexOf("a-end"));
  });
});
