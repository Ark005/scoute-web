"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CityPOI } from "@/lib/types";

type Props = {
  citySlug: string;
  cityName: string;
  pois: CityPOI[];
};

type Tab = "cards" | "board" | "combined";

const TAB_LABELS: { value: Tab; label: string; icon: string }[] = [
  { value: "cards", label: "Карточки", icon: "▦" },
  { value: "board", label: "Доска", icon: "≡" },
  { value: "combined", label: "Объединённый", icon: "▤" },
];

const FILTERS = [
  { value: "all", label: "Все", emoji: "" },
  { value: "architecture", label: "Архитектура", emoji: "🏛" },
  { value: "culture", label: "Культура", emoji: "🎭" },
  { value: "history", label: "История", emoji: "🏛" },
  { value: "museum", label: "Музеи", emoji: "🏛" },
  { value: "park", label: "Парки", emoji: "🌳" },
  { value: "religion", label: "Религия", emoji: "⛪" },
];

const DAY_COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EAB308"];

function categoryLabel(c?: string): { label: string; emoji: string } {
  const k = (c || "").toLowerCase();
  if (k.includes("архитект") || k === "architecture") return { label: "Архитектура", emoji: "🏛" };
  if (k.includes("культур") || k === "culture") return { label: "Культура", emoji: "🎭" };
  if (k.includes("истори") || k === "history") return { label: "История", emoji: "🏛" };
  if (k.includes("музей") || k === "museum") return { label: "Музей", emoji: "🏛" };
  if (k.includes("парк") || k === "park") return { label: "Парк", emoji: "🌳" };
  if (k.includes("религи") || k.includes("церков") || k.includes("монаст") || k === "religion")
    return { label: "Религия", emoji: "⛪" };
  if (k.includes("ресторан") || k === "restaurant") return { label: "Ресторан", emoji: "🍽" };
  return { label: c || "Место", emoji: "📍" };
}

function matchesFilter(p: CityPOI, f: string): boolean {
  if (f === "all") return true;
  const c = (p.category || "").toLowerCase();
  if (f === "architecture") return c.includes("архитект");
  if (f === "culture") return c.includes("культур");
  if (f === "history") return c.includes("истори");
  if (f === "museum") return c.includes("музей");
  if (f === "park") return c.includes("парк");
  if (f === "religion")
    return c.includes("религи") || c.includes("церков") || c.includes("монаст") || c.includes("собор");
  return true;
}

function absUrl(u?: string): string {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return u;
}

export default function CityExplorer({ citySlug, cityName, pois }: Props) {
  const [tab, setTab] = useState<Tab>("combined");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [days, setDays] = useState<{ id: number; pois: CityPOI[] }[]>([
    { id: 1, pois: [] },
    { id: 2, pois: [] },
    { id: 3, pois: [] },
  ]);
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  const filteredPois = useMemo(() => {
    const s = search.toLowerCase().trim();
    return pois.filter((p) => {
      if (!matchesFilter(p, filter)) return false;
      if (s && !p.name.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [pois, filter, search]);

  const placedIds = useMemo(() => {
    const set = new Set<number>();
    for (const d of days) for (const p of d.pois) set.add(p.id);
    return set;
  }, [days]);

  function addDay() {
    setDays((d) => [...d, { id: Math.max(0, ...d.map((x) => x.id)) + 1, pois: [] }]);
  }

  function clickPoi(p: CityPOI) {
    if (placedIds.has(p.id)) {
      // remove from any day
      setDays((d) => d.map((x) => ({ ...x, pois: x.pois.filter((q) => q.id !== p.id) })));
      return;
    }
    if (activeDayIdx === null) {
      setActiveDayIdx(0);
    }
    const idx = activeDayIdx ?? 0;
    setDays((d) => d.map((x, i) => (i === idx ? { ...x, pois: [...x.pois, p] } : x)));
  }

  function autofill() {
    if (filteredPois.length === 0) return;
    const top = [...filteredPois].sort((a, b) => (b.rating || 0) - (a.rating || 0)).filter((p) => !placedIds.has(p.id));
    setDays((current) => {
      const next = current.map((d) => ({ ...d }));
      let cursor = 0;
      for (const p of top) {
        // 4 POI per day, max
        while (cursor < next.length && next[cursor].pois.length >= 4) cursor++;
        if (cursor >= next.length) break;
        next[cursor].pois.push(p);
      }
      return next;
    });
  }

  const showLeft = tab !== "board";
  const showRight = tab !== "cards";

  return (
    <div className="min-h-[calc(100vh-56px)]" style={{ background: "var(--bg, #F9FAFB)" }}>
      {/* Header bar with city name + tabs */}
      <div className="sticky top-14 z-40" style={{ background: "var(--dark)", color: "white" }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/cities" className="text-white/80 hover:text-white">←</Link>
          <div>
            <div
              className="font-bold text-lg leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {cityName}
            </div>
            <div className="text-xs text-white/60">{pois.length} мест</div>
          </div>

          <div className="flex items-center gap-1 ml-auto p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
            {TAB_LABELS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                style={{
                  background: tab === t.value ? "white" : "transparent",
                  color: tab === t.value ? "var(--dark)" : "rgba(255,255,255,0.7)",
                }}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-5">
        <div className="grid gap-5" style={{
          gridTemplateColumns: showLeft && showRight ? "1.2fr 1fr" : "1fr",
        }}>
          {/* LEFT — POIs */}
          {showLeft && (
            <div>
              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔎 Поиск по местам..."
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{ background: "white", border: "1px solid #E5E7EB" }}
                />
              </div>
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition"
                    style={{
                      background: filter === f.value ? "var(--blue)" : "white",
                      color: filter === f.value ? "white" : "var(--dark)",
                      border: "1px solid " + (filter === f.value ? "var(--blue)" : "#E5E7EB"),
                    }}
                  >
                    {f.emoji && <span className="mr-1">{f.emoji}</span>}
                    {f.label}
                  </button>
                ))}
              </div>
              {/* POI cards grid */}
              {filteredPois.length === 0 ? (
                <div className="text-center text-gray-500 py-12">Ничего не найдено</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredPois.map((p) => {
                    const cat = categoryLabel(p.category);
                    const placed = placedIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => clickPoi(p)}
                        className="group text-left rounded-2xl overflow-hidden bg-white transition hover:shadow-lg"
                        style={{
                          border: placed ? "2px solid var(--blue)" : "1px solid #E5E7EB",
                          opacity: placed ? 0.7 : 1,
                        }}
                      >
                        <div className="relative aspect-[4/3] bg-gray-100">
                          {p.image_url ? (
                            <img
                              src={absUrl(p.image_url)}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              {cat.emoji}
                            </div>
                          )}
                          <div
                            className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: "rgba(15,23,42,0.85)", color: "white" }}
                          >
                            {cat.emoji} {cat.label}
                          </div>
                          <div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              background: placed ? "var(--blue)" : "rgba(255,255,255,0.85)",
                              color: placed ? "white" : "#9CA3AF",
                            }}
                          >
                            {placed ? "✓" : "○"}
                          </div>
                        </div>
                        <div className="p-3">
                          <div
                            className="font-bold text-sm leading-tight mb-1.5"
                            style={{ color: "var(--dark)" }}
                          >
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            {p.rating ? <span>⭐ {p.rating}</span> : null}
                            {p.avg_time_min ? <span>⏱ {p.avg_time_min}м</span> : null}
                            {p.free_entry ? (
                              <span style={{ color: "#10B981" }}>Бесплатно</span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* RIGHT — Planner */}
          {showRight && (
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="font-bold text-sm flex items-center gap-2"
                  style={{ color: "var(--dark)" }}
                >
                  📋 Маршрут
                </div>
                <button
                  onClick={addDay}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "white", border: "1px solid #E5E7EB", color: "var(--dark)" }}
                >
                  + День
                </button>
                <button
                  onClick={autofill}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: "#FF6B1B" }}
                >
                  ✨ Автозаполнение
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                {days.map((d, i) => {
                  const color = DAY_COLORS[i % DAY_COLORS.length];
                  const active = activeDayIdx === i;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setActiveDayIdx(i)}
                      className="rounded-2xl p-3 cursor-pointer transition"
                      style={{
                        background: active ? color + "10" : "white",
                        border: `2px ${active ? "solid" : "dashed"} ${color}`,
                        minHeight: 220,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: color }}
                          />
                          <span className="font-bold text-sm" style={{ color: "var(--dark)" }}>
                            День {i + 1}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDays((all) => all.filter((_, j) => j !== i));
                            if (activeDayIdx === i) setActiveDayIdx(null);
                          }}
                          className="text-gray-400 hover:text-red-500 text-sm"
                          aria-label="Удалить день"
                        >
                          ✕
                        </button>
                      </div>
                      {d.pois.length === 0 ? (
                        <div
                          className="flex items-center justify-center text-xs text-center py-12 px-2 rounded-lg"
                          style={{ color: color, background: color + "08" }}
                        >
                          {active
                            ? "Нажми на карточку слева, чтобы добавить"
                            : "Перетащи сюда или клик-сюда → потом место"}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {d.pois.map((p, j) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg"
                              style={{ background: color + "10" }}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ background: color }}
                              >
                                {j + 1}
                              </span>
                              <span className="flex-1 truncate" style={{ color: "var(--dark)" }}>
                                {p.name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDays((all) =>
                                    all.map((x, k) =>
                                      k === i ? { ...x, pois: x.pois.filter((q) => q.id !== p.id) } : x,
                                    ),
                                  );
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {days.every((d) => d.pois.length === 0) && (
                <div className="text-center text-xs text-gray-500 mt-4">
                  Нажми на карточку и выбери место, или ✨ Автозаполнение
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
