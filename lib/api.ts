import { RouteListItem, RouteDetail, City, POI } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

async function get<T>(path: string, revalidate = 3600): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function getRoutes(): Promise<RouteListItem[]> {
  return get<RouteListItem[]>("/routes/");
}

export async function getRoute(slug: string): Promise<RouteDetail> {
  return get<RouteDetail>(`/routes/${slug}/`);
}

export async function getCities(): Promise<City[]> {
  return get<City[]>("/cities/");
}

export async function getCityPOIs(slug: string): Promise<POI[]> {
  return get<POI[]>(`/cities/${slug}/pois/`);
}
