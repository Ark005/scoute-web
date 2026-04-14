"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { RouteDetail, Waypoint } from "@/lib/types";
import { REGION_LABELS } from "@/lib/regions";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

interface Props {
  route: RouteDetail;
}

export default function RouteDetailView({ route }: Props) {
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);
  const waypoints = route.waypoints_preview ?? [];

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
        <div className="flex gap-3 mt-2 text-white/60 text-sm flex-wrap">
          <span>📍 {REGION_LABELS[route.region] ?? route.region}</span>
          <span>🚗 {route.distance_km} км</span>
          <span>📅 {route.duration_days} {dayWord(route.duration_days)}</span>
          {route.is_free ? (
            <span className="text-green-400 font-semibold">Бесплатно</span>
          ) : (
            <span className="text-yellow-400 font-semibold">от {route.price_rub} ₽</span>
          )}
        </div>
      </div>

      {/* Map + List split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div className="h-56 lg:h-auto lg:flex-1 lg:order-2 relative">
          <RouteMap
            waypoints={waypoints}
            polyline={route.polyline ?? []}
            hoveredStop={hoveredStop}
          />
        </div>

        {/* Stop list */}
        <div className="lg:w-96 lg:order-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <div className="p-4 space-y-3">
            {route.description && (
              <p className="text-sm leading-relaxed text-gray-600 bg-white rounded-xl p-3 border border-gray-100">
                {route.description}
              </p>
            )}

            {waypoints.map((wp, idx) => (
              <WaypointCard
                key={wp.id}
                wp={wp}
                index={idx + 1}
                isHovered={hoveredStop === wp.id}
                onHover={setHoveredStop}
              />
            ))}

            <Link
              href={`/routes/${route.slug}/plan`}
              className="block mt-4 text-center text-white text-sm font-bold py-3 rounded-xl transition hover:opacity-90"
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

function WaypointCard({
  wp, index, isHovered, onHover,
}: {
  wp: Waypoint;
  index: number;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}) {
  const TYPE_ICONS: Record<string, string> = {
    attraction: "🏛",
    restaurant: "🍽",
    hotel: "🏨",
    parking: "🅿️",
    gas: "⛽",
    viewpoint: "🌄",
  };

  return (
    <div
      className={`bg-white rounded-xl p-3 border transition cursor-pointer ${
        isHovered ? "border-blue-400 shadow-md" : "border-gray-100 shadow-sm"
      }`}
      onMouseEnter={() => onHover(wp.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(wp.id)}
      onTouchEnd={() => onHover(null)}
    >
      <div className="flex gap-3">
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "var(--blue)" }}
        >
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--dark)" }}>
            {TYPE_ICONS[wp.waypoint_type] ?? "📍"} {wp.name}
          </p>
          {wp.description && (
            <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--grey)" }}>
              {wp.description}
            </p>
          )}
          <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--grey)" }}>
            {wp.duration_min > 0 && <span>⏱ {wp.duration_min} мин</span>}
            {wp.distance_from_prev_km && <span>🚗 {wp.distance_from_prev_km} км</span>}
          </div>
          {wp.tip && (
            <p className="text-xs mt-1 text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
              💡 {wp.tip}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function dayWord(n: number) {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}
