import path from "path";
import fs from "fs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const bundledDbPath = path.join(process.cwd(), "prisma/dev.db");
  const dbPath =
    process.env.VERCEL === "1"
      ? path.join("/tmp", "ecobus-demo.db")
      : bundledDbPath;

  if (process.env.VERCEL === "1" && !fs.existsSync(dbPath)) {
    fs.copyFileSync(bundledDbPath, dbPath);
  }

  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
