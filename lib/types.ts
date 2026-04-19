export interface Highlight {
  name: string;
  icon?: string;
  type?: string;
  duration_min?: number;
  price_rub?: number;
  description?: string;
  tip?: string;
}

export interface Waypoint {
  id: number;
  order: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  waypoint_type: string;
  duration_min: number;
  tip: string;
  image_url: string;
  distance_from_prev_km: number | null;
  day?: number;
  // Hotel fields
  hotel_url?: string;
  hotel_price_from?: number | null;
  // Gas fields
  gas_brand?: string;
  gas_discount?: string;
  // Extended
  images?: string[];
  highlights?: Highlight[];
  // Practical info v3
  opening_hours?: string;
  is_closed?: boolean;
  closed_reason?: string;
  avg_check?: number | null;
  menu_url?: string;
  entrance_fee?: number | null;
  phone?: string;
  website_url?: string;
}

export interface RouteListItem {
  slug: string;
  title: string;
  region: string;
  distance_km: number;
  duration_days: number;
  cover_image: string;
  waypoints_preview: Waypoint[];
  is_free: boolean;
  price_rub: number;
  tags?: string[];
}

export interface RouteDetail {
  slug: string;
  title: string;
  region: string;
  distance_km: number;
  duration_days: number;
  description: string;
  cover_image: string;
  is_free: boolean;
  price_rub: number;
  waypoints_preview: Waypoint[];
  waypoints?: Waypoint[];
  polyline: [number, number][];
  tags?: string[];
  vehicle_type?: string;
  best_season?: string;
  difficulty?: string;
  author_name?: string;
  author_bio?: string;
  author_avatar?: string;
  fuel_consumption_l100?: number;
}

export interface RouteWithTransport extends RouteDetail {
  start_lat?: number;
  start_lng?: number;
}

export interface CityWeather {
  temp: number;
  description: string;
  icon: string;
}

export interface CityPOI {
  id: number;
  type: "attraction" | "restaurant";
  name: string;
  category: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  avg_time_min?: number;
  rating?: number;
  image_url?: string;
  opening_hours?: { hours?: string; fee?: string; closed?: boolean } | string;
  free_entry?: boolean;
  entrance_fee?: number | null;
  tip?: string;
  address?: string;
  phone?: string;
  must_see?: boolean;
  // restaurant fields
  cuisine_type?: string;
  price_range?: string;
  avg_check?: number;
  menu_url?: string;
}
