import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbPath = path.join(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.booking.deleteMany();
  await prisma.user.deleteMany();

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
