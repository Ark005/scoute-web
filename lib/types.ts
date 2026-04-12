export interface RouteTag {
  name: string;
}

export interface RouteListItem {
  slug: string;
  title: string;
  region: string;
  distance_km: number;
  duration_days: number;
  preview_image: string | null;
  tags: string[];
  is_premium: boolean;
}

export interface Stop {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  order: number;
  day: number;
  category: string;
  image: string | null;
  duration_minutes: number | null;
  price_rub: number | null;
}

export interface RouteDetail {
  slug: string;
  title: string;
  region: string;
  distance_km: number;
  duration_days: number;
  description: string;
  preview_image: string | null;
  tags: string[];
  is_premium: boolean;
  stops: Stop[];
}

export interface City {
  name: string;
  slug: string;
  poi_count: number;
}

export interface POI {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  image: string | null;
  rating: number | null;
  price_level: number | null;
}
