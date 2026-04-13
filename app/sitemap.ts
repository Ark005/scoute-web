import { getRoutes } from "@/lib/api";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await getRoutes().catch(() => []);
  return [
    { url: "https://scoute.app", changeFrequency: "weekly", priority: 1 },
    { url: "https://scoute.app/routes", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://scoute.app/autopilot", changeFrequency: "monthly", priority: 0.7 },
    ...routes.map((r) => ({
      url: `https://scoute.app/routes/${r.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
