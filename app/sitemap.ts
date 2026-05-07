import { getRoutes, getCities, getCityPOIsFromAPI } from "@/lib/api";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [routes, cities] = await Promise.all([
    getRoutes().catch(() => []),
    getCities().catch(() => []),
  ]);

  // Собираем POI всех городов для индивидуальных страниц
  const poiEntries: MetadataRoute.Sitemap = [];
  for (const city of cities) {
    try {
      const data = await getCityPOIsFromAPI(city.slug);
      for (const a of data.attractions) {
        poiEntries.push({
          url: `https://scoute.app/poi/attraction/${a.id}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
      for (const r of data.restaurants) {
        poiEntries.push({
          url: `https://scoute.app/poi/restaurant/${r.id}`,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    } catch {
      // skip city if API fails
    }
  }

  return [
    { url: "https://scoute.app", changeFrequency: "weekly", priority: 1 },
    { url: "https://scoute.app/routes", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://scoute.app/cities", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://scoute.app/autopilot", changeFrequency: "monthly", priority: 0.7 },
    ...routes.map((r) => ({
      url: `https://scoute.app/routes/${r.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...cities.map((c) => ({
      url: `https://scoute.app/cities/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...poiEntries,
  ];
}
