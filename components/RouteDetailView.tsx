"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { RouteDetail, Stop } from "@/lib/types";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

interface Props {
  route: RouteDetail;
}

export default function RouteDetailView({ route }: Props) {
  const days = Array.from(
    new Set(route.stops.map((s) => s.day))
  ).sort((a, b) => a - b);

  const [activeDay, setActiveDay] = useState(days[0] ?? 1);
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);

  const stopsByDay = days.reduce<Record<number, Stop[]>>((acc, d) => {
    acc[d] = route.stops.filter((s) => s.day === d).sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const allStops = stopsByDay[activeDay] ?? [];

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
        <div className="flex gap-3 mt-2 text-white/60 text-sm">
          <span>📍 {route.region}</span>
          <span>🚗 {route.distance_km} км</span>
          <span>
            📅 {route.duration_days} {dayWord(route.duration_days)}
          </span>
        </div>
      </div>

      {/* Day tabs */}
      {days.length > 1 && (
        <div
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none"
          style={{ background: "var(--dark)" }}
        >
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                activeDay === d ? "text-white" : "text-white/50 bg-white/10 hover:text-white"
              }`}
              style={activeDay === d ? { background: "var(--blue)" } : undefined}
            >
              День {d}
            </button>
          ))}
        </div>
      )}

      {/* Map + List split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map — top on mobile, right on desktop */}
        <div className="h-56 lg:h-auto lg:flex-1 lg:order-2 relative">
          <RouteMap
            stops={allStops}
            hoveredStop={hoveredStop}
          />
        </div>

        {/* Stop list — bottom on mobile, left on desktop */}
        <div
          className="lg:w-96 lg:order-1 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="p-4 space-y-3">
            {allStops.map((stop, idx) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={idx + 1}
                isHovered={hoveredStop === stop.id}
                onHover={setHoveredStop}
              />
            ))}

            {/* Plan CTA */}
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

function StopCard({
  stop,
  index,
  isHovered,
  onHover,
}: {
  stop: Stop;
  index: number;
  isHovered: boolean;
  onHover: (id: number | null) => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-3 border transition cursor-pointer ${
        isHovered ? "border-blue-400 shadow-md" : "border-gray-100 shadow-sm"
      }`}
      onMouseEnter={() => onHover(stop.id)}
      onMouseLeave={() => onHover(null)}
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
            {stop.name}
          </p>
          {stop.category && (
            <p className="text-xs mt-0.5" style={{ color: "var(--grey)" }}>
              {stop.category}
            </p>
          )}
          {stop.description && (
            <p
              className="text-xs mt-1 line-clamp-2 leading-relaxed"
              style={{ color: "var(--grey)" }}
            >
              {stop.description}
            </p>
          )}
          {(stop.duration_minutes || stop.price_rub) && (
            <div className="flex gap-3 mt-1.5 text-xs" style={{ color: "var(--grey)" }}>
              {stop.duration_minutes && <span>⏱ {stop.duration_minutes} мин</span>}
              {stop.price_rub && <span>💳 от {stop.price_rub} ₽</span>}
            </div>
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
