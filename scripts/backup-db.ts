import { mkdir, copyFile, stat } from "fs/promises";
import path from "path";

async function main() {
  const source = path.join(process.cwd(), "prisma/dev.db");
  await stat(source);

  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(backupDir, `ecobus-${stamp}.db`);

  await copyFile(source, destination);
  console.log(`Database backup created: ${destination}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
