"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { thumbUrl } from "@/lib/thumb";

type Slot = {
  type: string;
  time?: string;
  name?: string;
  id?: number;
  duration_min?: number;
  image_url?: string;
  description?: string;
  mode?: string;
  minutes?: number;
  distance_km?: number;
  is_event?: boolean;
  event_date?: string;
  ticket_url?: string;
  extra?: any;
};

type Day = { day?: number; slots?: Slot[]; items?: Slot[] };

type Props = {
  tripId: string;
  citySlug: string | null;
  days: Day[];
  /** Альтернативы для замены — раздельно: достопримечательности и рестораны. */
  attractionAlts?: Slot[];
  restaurantAlts?: Slot[];
};

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

const DAY_COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EAB308"];

function absUrl(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return u;
}

function modeLabel(m?: string) {
  return ({ walk: "пешком", car: "на машине", taxi: "на такси", transit: "транспортом" } as any)[m || "walk"] || m;
}

function poiHref(s: Slot): string | null {
  if (!s.id) return null;
  return `/poi/attraction/${s.id}`;
}

export default function TripTimeline({
  tripId, citySlug, days, attractionAlts = [], restaurantAlts = [],
}: Props) {
  const [program, setProgram] = useState<Day[]>(days);
  const [swapForSlot, setSwapForSlot] = useState<{
    dayIdx: number; slotIdx: number; kind: "attraction" | "restaurant";
  } | null>(null);
  const [savingSwap, setSavingSwap] = useState(false);

  const swapAlternatives = useMemo<Slot[]>(() => {
    if (!swapForSlot) return [];
    return swapForSlot.kind === "restaurant" ? restaurantAlts : attractionAlts;
  }, [swapForSlot, restaurantAlts, attractionAlts]);

  function openSwap(dayIdx: number, slotIdx: number, kind: "attraction" | "restaurant") {
    setSwapForSlot({ dayIdx, slotIdx, kind });
  }

  function closeSwap() {
    setSwapForSlot(null);
  }

  async function applySwap(replacement: Slot) {
    if (!swapForSlot) return;
    setSavingSwap(true);
    try {
      const next = program.map((d, i) =>
        i === swapForSlot.dayIdx
          ? {
              ...d,
              slots: (d.slots || []).map((s, j) =>
                j === swapForSlot.slotIdx
                  ? {
                      ...s,
                      id: replacement.id,
                      name: replacement.name,
                      image_url: replacement.image_url,
                      description: replacement.description,
                    }
                  : s,
              ),
            }
          : d,
      );
      setProgram(next);
      // Persist via /api/trip/<id>/ PATCH not implemented yet — store locally only.
      // TODO: optional PATCH endpoint to save changes.
      closeSwap();
    } finally {
      setSavingSwap(false);
    }
  }

  return (
    <div className="space-y-6">
      {program.map((d, di) => {
        const slots = (d.slots || d.items || []) as Slot[];
        const color = DAY_COLORS[di % DAY_COLORS.length];
        return (
          <section key={di}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ background: color }} />
              <h3
                className="font-extrabold leading-tight"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 22,
                  color: "var(--dark)",
                }}
              >
                День {d.day || di + 1}
              </h3>
            </div>
            <div className="space-y-2">
              {slots.map((s, si) => {
                if (s.type === "transit") {
                  return (
                    <div
                      key={si}
                      className="flex items-center gap-2 py-1.5 pl-12 text-xs italic text-gray-400"
                    >
                      <span>↓</span>
                      <span>
                        {s.minutes ? `${s.minutes} мин ` : ""}
                        {modeLabel(s.mode)}
                        {s.distance_km != null ? ` (${s.distance_km} км)` : ""}
                      </span>
                    </div>
                  );
                }
                if (s.type === "start") {
                  return (
                    <div key={si} className="flex items-center gap-3 px-3 py-2">
                      <div className="font-mono text-xs text-gray-500 w-12 shrink-0">
                        {s.time || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <span className="font-bold text-sm" style={{ color: "var(--dark)" }}>
                          Старт: {s.name}
                        </span>
                      </div>
                    </div>
                  );
                }
                // attraction / restaurant / lunch / other
                const href = poiHref(s);
                const isMeal =
                  s.type === "lunch" || s.type === "dinner" || s.type === "breakfast";
                const icon =
                  s.type === "breakfast"
                    ? "☕"
                    : s.type === "dinner"
                    ? "🌙"
                    : isMeal
                    ? "🍽"
                    : "📍";
                return (
                  <article
                    key={si}
                    className="rounded-2xl overflow-hidden flex bg-white"
                    style={{ border: "1px solid #E5E7EB" }}
                  >
                    {/* time column */}
                    <div
                      className="shrink-0 w-16 sm:w-20 flex flex-col items-center justify-center text-center py-3"
                      style={{ background: color + "0F", borderRight: "1px solid #E5E7EB" }}
                    >
                      <div
                        className="font-mono font-bold text-sm"
                        style={{ color }}
                      >
                        {s.time || "—"}
                      </div>
                      {s.duration_min && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {s.duration_min} мин
                        </div>
                      )}
                    </div>
                    {/* photo */}
                    {s.image_url ? (
                      <Link
                        href={href || "#"}
                        className="shrink-0 w-24 sm:w-32 bg-gray-100 relative group"
                      >
                        <img
                          src={thumbUrl(s.image_url, { w: 256, h: 256, q: 75, fit: "cover" })}
                          alt={s.name || ""}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    ) : (
                      <div
                        className="shrink-0 w-24 sm:w-32 flex items-center justify-center text-3xl"
                        style={{ background: color + "08" }}
                      >
                        {icon}
                      </div>
                    )}
                    {/* content */}
                    <div className="flex-1 min-w-0 p-3 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link
                          href={href || "#"}
                          className="font-bold text-sm leading-tight hover:underline"
                          style={{ color: "var(--dark)" }}
                        >
                          {icon} {s.name}
                        </Link>
                        <button
                          onClick={() => openSwap(di, si, isMeal ? "restaurant" : "attraction")}
                          className="shrink-0 text-xs px-2 py-1 rounded-md transition hover:bg-gray-100"
                          style={{ color: color, border: `1px solid ${color}40` }}
                          title={isMeal ? "Заменить ресторан" : "Заменить место"}
                        >
                          🔄
                        </button>
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">
                          {s.description}
                        </p>
                      )}
                      {/* Per-slot buy button — только реальный билет на событие.
                          GYG/TripAdvisor поиск-ссылки убраны: партнёрки нет, $0 + утечка трафика. */}
                      {s.is_event && s.ticket_url && (
                        <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
                          <a
                            href={s.ticket_url}
                            target="_blank"
                            rel="noopener sponsored"
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition hover:scale-105 text-white"
                            style={{ background: "#F97316" }}
                            title="Купить билет на событие"
                          >
                            🎫 Купить билет
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* SWAP MODAL */}
      {swapForSlot && (
        <div
          onClick={closeSwap}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.6)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E7EB" }}>
              <div
                className="font-extrabold"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 18,
                  color: "var(--dark)",
                }}
              >
                {swapForSlot?.kind === "restaurant" ? "Заменить ресторан" : "Заменить место"}
              </div>
              <button onClick={closeSwap} className="text-gray-400 hover:text-gray-700 text-xl">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {swapAlternatives.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Не удалось загрузить альтернативы для этого города. Попробуйте ещё раз позже.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {swapAlternatives.slice(0, 18).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applySwap(p)}
                      disabled={savingSwap}
                      className="text-left rounded-xl overflow-hidden bg-white transition hover:shadow-lg disabled:opacity-50"
                      style={{ border: "1px solid #E5E7EB" }}
                    >
                      <div className="aspect-[4/3] bg-gray-100">
                        {p.image_url && (
                          <img
                            src={thumbUrl(p.image_url, { w: 300, h: 225, q: 75, fit: "cover" })}
                            alt={p.name || ""}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <div
                          className="font-bold text-xs leading-tight line-clamp-2"
                          style={{ color: "var(--dark)" }}
                        >
                          {p.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
