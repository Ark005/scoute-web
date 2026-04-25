import { RouteListItem, RouteDetail, CityPOI, CityWeather, CityInfo } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

const isLocal = BASE.includes("localhost") || BASE.includes("127.0.0.1");

async function get<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    "User-Agent": "ScouteSSR/1.0 (+https://scoute.app)",
    "Referer": "https://scoute.app",
  };
  if (!isLocal) {
    headers["Authorization"] = "Basic c2NvdXQ6U2NvdXQyMDI2IQ==";
  }
  const res = await fetch(`${BASE}${path}`, {
    headers,
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

export async function getCityPOIs(slug: string): Promise<{ attractions: CityPOI[]; restaurants: CityPOI[] }> {
  return get<{ attractions: CityPOI[]; restaurants: CityPOI[] }>(`/city-pois/?city=${slug}`);
}

export async function getCityWeather(slug: string): Promise<CityWeather> {
  return get<CityWeather>(`/weather/?city=${slug}`);
}

export async function getCities(): Promise<CityInfo[]> {
  return get<CityInfo[]>("/cities/");
}

export async function getCityPOIsFromAPI(slug: string): Promise<{
  city: { id: number; name: string; slug: string; latitude: number; longitude: number };
  attractions: CityPOI[];
  restaurants: CityPOI[];
}> {
  return get(`/city-pois/?city=${slug}`);
}
