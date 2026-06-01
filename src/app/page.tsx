import { getTerminals } from "@/lib/api";
import { HomeContent } from "@/components/HomeContent";
import { getDbSiteSettings } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const terminals = await getTerminals();
  const settings = await getDbSiteSettings();

  return <HomeContent terminals={terminals} initialSettings={settings} />;
}
