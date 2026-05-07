import { getRoutes } from "@/lib/api";
import HomeExplore from "@/components/HomeExplore";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const routes = await getRoutes().catch(() => []);
  return <HomeExplore routes={routes} />;
}
