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
