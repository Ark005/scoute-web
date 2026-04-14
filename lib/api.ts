import { RouteListItem, RouteDetail } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "User-Agent": "ScouteSSR/1.0 (+https://scoute.app)",
      "Referer": "https://scoute.app",
      "Authorization": "Basic c2NvdXQ6U2NvdXQyMDI2IQ==",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function getRoutes(): Promise<RouteListItem[]> {
  return get<RouteListItem[]>("/auto/routes/");
}

export async function getRoute(slug: string): Promise<RouteDetail> {
  return get<RouteDetail>(`/auto/routes/${slug}/`);
}

export async function getFeaturedRoutes(): Promise<RouteListItem[]> {
  return get<RouteListItem[]>("/auto/featured/");
}
