"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { RouteDetail, Waypoint } from "@/lib/types";
import { REGION_LABELS } from "@/lib/regions";
import TransportBlock from "./TransportBlock";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

interface Props {
  route: RouteDetail;
}

const TYPE_ICONS: Record<string, string> = {
  attraction: "🏛",
  restaurant: "🍽",
  hotel: "🏨",
  parking: "🅿️",
  gas: "⛽",
  viewpoint: "🌄",
  border: "🛂",
};

const TYPE_LABELS: Record<string, string> = {
  attraction: "Достопримечательность",
  restaurant: "Где поесть",
  hotel: "Где остановиться",
  parking: "Парковка",
  gas: "Заправка",
  viewpoint: "Смотровая",
  border: "КПП / Граница",
};

const VEHICLE_LABELS: Record<string, string> = {
  any: "Любой автомобиль",
  suv: "SUV / Кроссовер",
  offroad: "4×4 / Внедорожник",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  hard: "text-red-600 bg-red-50",
};

function groupByDay(waypoints: Waypoint[], totalDays: number): Map<number, Waypoint[]> {
  const grouped = new Map<number, Waypoint[]>();

  // If waypoints have day field, use it
  const hasDays = waypoints.some((wp) => wp.day && wp.day > 0);

  if (hasDays) {
    for (const wp of waypoints) {
      const day = wp.day || 1;
      if (!grouped.has(day)) grouped.set(day, []);
      grouped.get(day)!.push(wp);
    }
  } else {
    // Auto-distribute: split waypoints evenly across days
    const perDay = Math.ceil(waypoints.length / Math.max(totalDays, 1));
    for (let i = 0; i < waypoints.length; i++) {
      const day = Math.floor(i / perDay) + 1;
      if (!grouped.has(day)) grouped.set(day, []);
      grouped.get(day)!.push(waypoints[i]);
    }
  }

  return grouped;
}

export default function RouteDetailView({ route }: Props) {
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Use full waypoints if available, fallback to preview
  const waypoints = route.waypoints ?? route.waypoints_preview ?? [];
  const dayGroups = useMemo(
    () => groupByDay(waypoints, route.duration_days),
    [waypoints, route.duration_days]
  );

  const totalDays = Math.max(route.duration_days, dayGroups.size);

  // Collect practical info
  const hotels = waypoints.filter((w) => w.waypoint_type === "hotel");
  const restaurants = waypoints.filter((w) => w.waypoint_type === "restaurant");
  const parkings = waypoints.filter((w) => w.waypoint_type === "parking");
  const gasStations = waypoints.filter((w) => w.waypoint_type === "gas");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--dark)" }} className="px-5 pt-10 pb-5">
        <Link
          href="/routes"
          className="inline-flex items-center gap-1 text-white/60 text-sm mb-3 hover:text-white transition"
        >
          ← Все маршруты
        </Link>
        <h1 className="text-white text-xl font-extrabold leading-tight">{route.title}</h1>

        {/* Route meta chips */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <Chip>🚗 {route.distance_km} км</Chip>
          <Chip>📅 {route.duration_days} {dayWord(route.duration_days)}</Chip>
          <Chip>📍 {waypoints.length} точек</Chip>
          {route.difficulty && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[route.difficulty] || ""}`}>
              {DIFFICULTY_LABELS[route.difficulty] || route.difficulty}
            </span>
          )}
          {route.vehicle_type && route.vehicle_type !== "any" && (
            <Chip>🚙 {VEHICLE_LABELS[route.vehicle_type]}</Chip>
          )}
          {route.is_free ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-400 bg-green-900/30">
              ✅ Бесплатно
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-yellow-400 bg-yellow-900/30">
              💎 от {route.price_rub} ₽
            </span>
          )}
        </div>

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {route.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Map + Content split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div className="h-56 lg:h-auto lg:flex-1 lg:order-2 relative lg:sticky lg:top-0">
          <RouteMap
            waypoints={waypoints}
            polyline={route.polyline ?? []}
            hoveredStop={hoveredStop}
          />
        </div>

        {/* Left panel — scrollable itinerary */}
        <div className="lg:w-[440px] lg:order-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
          <div className="p-4 space-y-4">
            {/* Description */}
            {route.description && (
              <p className="text-sm leading-relaxed text-gray-600 bg-white rounded-xl p-4 border border-gray-100">
                {route.description}
              </p>
            )}

            {/* Transport options */}
            <TransportBlock slug={route.slug} startLat={(route as any).start_lat} startLng={(route as any).start_lng} />

            {/* Quick info cards */}
            <QuickInfoBar
              hotels={hotels}
              restaurants={restaurants}
              parkings={parkings}
              gasStations={gasStations}
              bestSeason={route.best_season}
              fuelConsumption={route.fuel_consumption_l100}
              distanceKm={route.distance_km}
            />

            {/* Day-by-day itinerary */}
            {Array.from(dayGroups.entries()).map(([day, wps]) => {
              const dayDistance = wps.reduce((s, w) => s + (w.distance_from_prev_km || 0), 0);
              const dayDuration = wps.reduce((s, w) => s + (w.duration_min || 0), 0);
              const isExpanded = expandedDay === day || expandedDay === null;

              return (
                <div key={day} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Day header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                    onClick={() => setExpandedDay(isExpanded && expandedDay !== null ? null : day)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: "var(--blue)" }}
                      >
                        {day}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold" style={{ color: "var(--dark)" }}>
                          День {day}
                        </p>
                        <p className="text-xs" style={{ color: "var(--grey)" }}>
                          {wps.length} {pointWord(wps.length)}
                          {dayDistance > 0 && ` · ${Math.round(dayDistance)} км`}
                          {dayDuration > 0 && ` · ~${formatDuration(dayDuration)}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {/* Day waypoints */}
                  {isExpanded && (
                    <div className="px-4 pb-3">
                      {wps.map((wp, idx) => (
                        <div key={wp.id}>
                          {/* Distance connector */}
                          {idx > 0 && wp.distance_from_prev_km && (
                            <DistanceConnector
                              km={wp.distance_from_prev_km}
                              durationMin={estimateDriveMin(wp.distance_from_prev_km)}
                            />
                          )}
                          {/* Also show distance from last stop of previous day */}
                          {idx === 0 && day > 1 && wp.distance_from_prev_km && (
                            <DistanceConnector
                              km={wp.distance_from_prev_km}
                              durationMin={estimateDriveMin(wp.distance_from_prev_km)}
                            />
                          )}
                          <WaypointCard
                            wp={wp}
                            index={wp.order}
                            isHovered={hoveredStop === wp.id}
                            onHover={setHoveredStop}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Best season */}
            {route.best_season && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800">🗓 Лучший сезон</p>
                <p className="text-sm text-blue-700 mt-1">{route.best_season}</p>
              </div>
            )}

            {/* Author */}
            {route.author_name && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                {route.author_avatar && (
                  <Image
                    src={route.author_avatar}
                    alt={route.author_name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--dark)" }}>
                    {route.author_name}
                  </p>
                  {route.author_bio && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--grey)" }}>
                      {route.author_bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Planner CTA */}
            <Link
              href={`/routes/${route.slug}/plan`}
              className="block text-center text-white text-sm font-bold py-3 rounded-xl transition hover:opacity-90"
              style={{ background: "var(--blue)" }}
            >
              Открыть планировщик →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Info Bar ───────────────────────────────── */

function QuickInfoBar({
  hotels, restaurants, parkings, gasStations, bestSeason, fuelConsumption, distanceKm,
}: {
  hotels: Waypoint[];
  restaurants: Waypoint[];
  parkings: Waypoint[];
  gasStations: Waypoint[];
  bestSeason?: string;
  fuelConsumption?: number;
  distanceKm: number;
}) {
  const fuelCost = fuelConsumption
    ? Math.round((distanceKm / 100) * fuelConsumption * 60) // ~60₽/л
    : null;

  const items: { icon: string; label: string; value: string }[] = [];

  if (hotels.length > 0) {
    const cheapest = hotels
      .filter((h) => h.hotel_price_from)
      .sort((a, b) => (a.hotel_price_from || 0) - (b.hotel_price_from || 0))[0];
    items.push({
      icon: "🏨",
      label: "Жильё",
      value: cheapest?.hotel_price_from
        ? `${hotels.length} вар. · от ${cheapest.hotel_price_from} ₽`
        : `${hotels.length} ${pointWord(hotels.length)}`,
    });
  }

  if (restaurants.length > 0) {
    items.push({
      icon: "🍽",
      label: "Еда",
      value: `${restaurants.length} мест`,
    });
  }

  if (parkings.length > 0) {
    items.push({
      icon: "🅿️",
      label: "Парковки",
      value: `${parkings.length} ${pointWord(parkings.length)}`,
    });
  }

  if (gasStations.length > 0) {
    items.push({
      icon: "⛽",
      label: "Заправки",
      value: `${gasStations.length} ${pointWord(gasStations.length)}`,
    });
  }

  if (fuelCost) {
    items.push({
      icon: "💰",
      label: "Бензин",
      value: `~${fuelCost.toLocaleString("ru")} ₽`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2"
        >
          <span className="text-lg">{item.icon}</span>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--grey)" }}>{item.label}</p>
            <p className="text-sm font-semibold" style={{ color: "var(--dark)" }}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Distance Connector ──────────────────────────── */

function DistanceConnector({ km, durationMin }: { km: number; durationMin: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 pl-3">
      <div className="w-0.5 h-6 bg-gray-200 ml-3" />
      <span className="text-xs" style={{ color: "var(--grey)" }}>
        🚗 {Math.round(km)} км · ~{formatDuration(durationMin)}
      </span>
    </div>
  );
}

/* ── Waypoint Card ───────────────────────────────── */

function WaypointCard({
  wp, index, isHovered, onHover,
}: {
  wp: Waypoint;
  index: number;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}) {
  const isHotel = wp.waypoint_type === "hotel";
  const isRestaurant = wp.waypoint_type === "restaurant";
  const isGas = wp.waypoint_type === "gas";

  return (
    <div
      className={`rounded-xl p-3 border transition cursor-pointer ${
        isHovered ? "border-blue-400 shadow-md bg-blue-50/30" : "border-gray-100 bg-gray-50/50"
      }`}
      onMouseEnter={() => onHover(wp.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(wp.id)}
      onTouchEnd={() => onHover(null)}
    >
      <div className="flex gap-3">
        {/* Number badge */}
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
          style={{ background: isHovered ? "var(--orange)" : "var(--blue)" }}
        >
          {index}
        </div>

        <div className="flex-1 min-w-0">
          {/* Type label */}
          <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--grey)" }}>
            {TYPE_LABELS[wp.waypoint_type] || "Точка маршрута"}
          </p>

          {/* Name */}
          <p className="font-bold text-sm leading-tight mt-0.5" style={{ color: "var(--dark)" }}>
            {TYPE_ICONS[wp.waypoint_type] ?? "📍"} {wp.name}
          </p>

          {/* Image */}
          {wp.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden relative h-32">
              <Image
                src={wp.image_url}
                alt={wp.name}
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}

          {/* Description */}
          {wp.description && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--grey)" }}>
              {wp.description}
            </p>
          )}

          {/* Duration & meta */}
          <div className="flex gap-3 mt-2 text-xs flex-wrap" style={{ color: "var(--grey)" }}>
            {wp.duration_min > 0 && <span>⏱ {formatDuration(wp.duration_min)}</span>}
          </div>

          {/* Hotel specific */}
          {isHotel && (
            <div className="mt-2 bg-blue-50 rounded-lg p-2">
              {wp.hotel_price_from && (
                <p className="text-sm font-semibold text-blue-800">
                  от {wp.hotel_price_from.toLocaleString("ru")} ₽ / ночь
                </p>
              )}
              {wp.hotel_url && (
                <a
                  href={wp.hotel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  Забронировать →
                </a>
              )}
            </div>
          )}

          {/* Restaurant specific */}
          {isRestaurant && wp.tip && (
            <div className="mt-2 bg-orange-50 rounded-lg p-2">
              <p className="text-xs text-orange-700">🍴 {wp.tip}</p>
            </div>
          )}

          {/* Gas station specific */}
          {isGas && (wp.gas_brand || wp.gas_discount) && (
            <div className="mt-2 bg-green-50 rounded-lg p-2 text-xs text-green-700">
              {wp.gas_brand && <span className="font-medium">{wp.gas_brand}</span>}
              {wp.gas_discount && <span> · {wp.gas_discount}</span>}
            </div>
          )}

          {/* Tip (for non-restaurant, since restaurant shows tip above) */}
          {wp.tip && !isRestaurant && (
            <p className="text-xs mt-2 text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
              💡 {wp.tip}
            </p>
          )}

          {/* Highlights (city guide) */}
          {wp.highlights && wp.highlights.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--grey)" }}>
                Что посмотреть
              </p>
              {wp.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span>{h.icon || "•"}</span>
                  <div>
                    <span className="font-medium" style={{ color: "var(--dark)" }}>{h.name}</span>
                    {h.duration_min && (
                      <span style={{ color: "var(--grey)" }}> · {h.duration_min} мин</span>
                    )}
                    {h.price_rub != null && h.price_rub > 0 && (
                      <span style={{ color: "var(--grey)" }}> · {h.price_rub} ₽</span>
                    )}
                    {h.description && (
                      <p className="mt-0.5" style={{ color: "var(--grey)" }}>{h.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional images */}
          {wp.images && wp.images.length > 0 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto">
              {wp.images.map((img, i) => (
                <div key={i} className="shrink-0 w-20 h-14 rounded-lg overflow-hidden relative">
                  <Image
                    src={img}
                    alt={`${wp.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small helpers ───────────────────────────────── */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
      {children}
    </span>
  );
}

function dayWord(n: number) {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}

function pointWord(n: number) {
  if (n === 1) return "точка";
  if (n >= 2 && n <= 4) return "точки";
  return "точек";
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function estimateDriveMin(km: number): number {
  // Average ~60 km/h for Russian roads
  return Math.round((km / 60) * 60);
}
