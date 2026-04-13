import { RouteListItem, RouteDetail } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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
