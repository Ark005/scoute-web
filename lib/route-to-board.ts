// Преобразование авторского маршрута в программу-доску Канбана.
// Точки маршрута группируются по ближайшему грузинскому городу — каждый
// город даёт отдельный city-блок на доске (мультигород). Времена точек
// внутри дня пересчитывает recalcDay (haversine).

import type { RouteDetail, Waypoint } from "./types";
import { recalcDay } from "./recalcDay";

// Опорные координаты грузинских городов — для определения «ближайшего города»
// точки маршрута. lib/cities-data.ts координат не содержит, поэтому таблица здесь.
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  tbilisi:   { lat: 41.693, lng: 44.801 },
  batumi:    { lat: 41.645, lng: 41.640 },
  kutaisi:   { lat: 42.270, lng: 42.706 },
  mtskheta:  { lat: 41.845, lng: 44.720 },
  sighnaghi: { lat: 41.617, lng: 45.922 },
  telavi:    { lat: 41.919, lng: 45.473 },
  kvareli:   { lat: 41.949, lng: 45.812 },
  borjomi:   { lat: 41.840, lng: 43.380 },
  bakuriani: { lat: 41.748, lng: 43.532 },
  gudauri:   { lat: 42.477, lng: 44.483 },
  kazbegi:   { lat: 42.656, lng: 44.643 },
  mestia:    { lat: 43.043, lng: 42.729 },
  gori:      { lat: 41.984, lng: 44.109 },
};

const DEFAULT_CITY = "tbilisi";
const MAX_POI_PER_DAY = 6;

// Служебные точки маршрута — не показываем как карточки доски.
const SKIP_TYPES = new Set(["parking", "gas", "border"]);

export type BoardSlot = {
  type: string;
  name: string;
  time: string;
  description: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  duration_min: number;
  id?: number;
};

export type BoardDay = { day: number; city_slug: string; slots: BoardSlot[] };

function nearestCity(lat: number, lng: number): string {
  let best = DEFAULT_CITY;
  let bestDist = Infinity;
  for (const [slug, c] of Object.entries(CITY_COORDS)) {
    // квадрат евклидова расстояния — для сравнения внутри Грузии достаточно
    const d = (lat - c.lat) ** 2 + (lng - c.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = slug;
    }
  }
  return best;
}

function slotType(wpType: string): string {
  if (wpType === "restaurant") return "restaurant";
  if (wpType === "hotel") return "hotel";
  return "attraction";
}

function toSlot(wp: Waypoint, idx: number): BoardSlot {
  return {
    type: slotType(wp.waypoint_type),
    name: wp.name,
    // стартовое время; recalcDay пересчитает с учётом переездов
    time: `${String(9 + idx).padStart(2, "0")}:00`,
    description: wp.description || "",
    latitude: typeof wp.latitude === "number" ? wp.latitude : undefined,
    longitude: typeof wp.longitude === "number" ? wp.longitude : undefined,
    image_url: wp.image_url || "",
    duration_min: wp.duration_min || 60,
    id: wp.id,
  };
}

/**
 * Маршрут → дни доски-черновика, сгруппированные по ближайшему городу.
 * Подряд идущие точки одного города образуют один city-блок; если точек
 * в блоке больше MAX_POI_PER_DAY — блок дробится на несколько дней.
 */
export function routeToBoardDays(route: RouteDetail): { days: BoardDay[]; citySlugs: string[] } {
  const raw = route.waypoints ?? route.waypoints_preview ?? [];
  const wps = raw
    .filter((w) => !SKIP_TYPES.has(w.waypoint_type))
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (wps.length === 0) return { days: [], citySlugs: [] };

  // Ближайший город каждой точки; точки без координат наследуют город предыдущей.
  let prevCity = DEFAULT_CITY;
  const tagged = wps.map((wp) => {
    const city =
      typeof wp.latitude === "number" && typeof wp.longitude === "number"
        ? nearestCity(wp.latitude, wp.longitude)
        : prevCity;
    prevCity = city;
    return { wp, city };
  });

  // Подряд идущие точки одного города — один city-блок.
  const runs: { city: string; wps: Waypoint[] }[] = [];
  for (const t of tagged) {
    const last = runs[runs.length - 1];
    if (last && last.city === t.city) last.wps.push(t.wp);
    else runs.push({ city: t.city, wps: [t.wp] });
  }

  // Каждый city-блок → один или несколько дней (≤ MAX_POI_PER_DAY точек на день).
  const days: BoardDay[] = [];
  let dayNum = 1;
  for (const run of runs) {
    for (let i = 0; i < run.wps.length; i += MAX_POI_PER_DAY) {
      const chunk = run.wps.slice(i, i + MAX_POI_PER_DAY);
      const slots = chunk.map((wp, idx) => toSlot(wp, idx));
      days.push({ day: dayNum++, city_slug: run.city, slots: recalcDay(slots) });
    }
  }

  const citySlugs = Array.from(new Set(days.map((d) => d.city_slug)));
  return { days, citySlugs };
}
