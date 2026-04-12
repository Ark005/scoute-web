import { getRoutes } from "@/lib/api";
import RouteCatalog from "@/components/RouteCatalog";

export const revalidate = 3600;

export const metadata = {
  title: "Маршруты по России — Scout",
  description:
    "Авторские автомаршруты по городам и регионам России. Подбор по расстоянию и продолжительности.",
};

export default async function RoutesPage() {
  let routes = await getRoutes().catch(() => []);

  return <RouteCatalog initialRoutes={routes} />;
}
