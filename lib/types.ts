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
  polyline: [number, number][];
}
