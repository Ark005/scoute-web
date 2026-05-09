"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CityPOI } from "@/lib/types";
import AddToTripButton from "@/components/AddToTripButton";
import {
  addToTripDraft,
  getTripDraft,
  isInTripDraft,
  removeFromTripDraft,
  subscribeTripDraft,
} from "@/lib/tripDraft";

type Props = {
  citySlug: string;
  cityName: string;
  pois: CityPOI[];
  events?: EventItem[];
};

type EventItem = {
  id: number;
  name: string;
  description: string;
  event_type: string;
  event_date: string | null;
  event_time: string | null;
  image_url: string;
  ticket_url: string;
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
  { value: "history", label: "История", emoji: "📜" },
  { value: "museum", label: "Музеи", emoji: "🏛" },
  { value: "park", label: "Парки", emoji: "🌳" },
  { value: "religion", label: "Религия", emoji: "⛪" },
  { value: "restaurant", label: "Рестораны", emoji: "🍽" },
];

const DAY_COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EAB308"];

const EVENT_TYPE_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  concert: { label: "Концерт", emoji: "🎵", color: "#7C3AED" },
  theatre: { label: "Театр", emoji: "🎭", color: "#DC2626" },
  festival: { label: "Фестиваль", emoji: "🎪", color: "#F59E0B" },
  exhibition: { label: "Выставка", emoji: "🖼", color: "#0EA5E9" },
  food: { label: "Гастро", emoji: "🍽", color: "#F97316" },
  other: { label: "Событие", emoji: "📅", color: "#64748B" },
};

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()].slice(0, 3) };
}

function categoryLabel(c?: string): { label: string; emoji: string } {
  const k = (c || "").toLowerCase();
  if (k.includes("ресторан") || k === "restaurant") return { label: "Ресторан", emoji: "🍽" };
  if (k.includes("архитект")) return { label: "Архитектура", emoji: "🏛" };
  if (k.includes("культур")) return { label: "Культура", emoji: "🎭" };
  if (k.includes("истори")) return { label: "История", emoji: "📜" };
  if (k.includes("музей")) return { label: "Музей", emoji: "🏛" };
  if (k.includes("парк")) return { label: "Парк", emoji: "🌳" };
  if (k.includes("религи") || k.includes("церков") || k.includes("монаст") || k.includes("собор"))
    return { label: "Религия", emoji: "⛪" };
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
  if (f === "restaurant") return c.includes("ресторан") || (p as any).type === "restaurant";
  if (f === "religion")
    return c.includes("религи") || c.includes("церков") || c.includes("монаст") || c.includes("собор");
  return true;
}

function poiHref(p: CityPOI): string {
  const t = (p as any).type === "restaurant" ? "restaurant" : "attraction";
  return `/poi/${t}/${p.id}`;
}

function absUrl(u?: string): string {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return u;
}

export default function CityExplorer({ citySlug, cityName, pois, events = [] }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("combined");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [days, setDays] = useState<{ id: number; pois: CityPOI[] }[]>([
    { id: 1, pois: [] },
    { id: 2, pois: [] },
    { id: 3, pois: [] },
  ]);
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [draftPoiIds, setDraftPoiIds] = useState<Set<number>>(new Set());
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const sync = () => {
      const ids = new Set<number>();
      for (const it of getTripDraft()) {
        if (it.kind === "poi") ids.add(it.id);
      }
      setDraftPoiIds(ids);
    };
    sync();
    return subscribeTripDraft(sync);
  }, []);

  function toggleDraft(p: CityPOI, ev?: React.MouseEvent) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (isInTripDraft("poi", p.id)) {
      removeFromTripDraft("poi", p.id);
    } else {
      addToTripDraft({
        kind: "poi",
        id: p.id,
        name: p.name,
        city_slug: citySlug,
        image_url: p.image_url ?? null,
      });
    }
  }
  const recRef = useRef<any>(null);
  const restCarouselRef = useRef<HTMLDivElement>(null);

  // Voice search via Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "ru-RU";
    r.continuous = false;
    r.interimResults = true;
    let final = "";
    r.onresult = (e: any) => {
      let interim = "";
      final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setSearch((final + interim).trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, []);

  function toggleVoice() {
    if (!recRef.current) return;
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      setSearch("");
      try { recRef.current.start(); setListening(true); } catch {}
    }
  }

  const filteredPois = useMemo(() => {
    const s = search.toLowerCase().trim();
    return pois.filter((p) => {
      if (!matchesFilter(p, filter)) return false;
      if (s && !p.name.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [pois, filter, search]);

  const restaurants = useMemo(
    () => pois.filter((p) => (p as any).type === "restaurant" && p.image_url).slice(0, 16),
    [pois],
  );

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.event_date && e.event_date >= today && e.image_url)
      .slice(0, 9);
  }, [events]);

  const placedIds = useMemo(() => {
    const set = new Set<number>();
    for (const d of days) for (const p of d.pois) set.add(p.id);
    return set;
  }, [days]);

  function addDay() {
    setDays((d) => [...d, { id: Math.max(0, ...d.map((x) => x.id)) + 1, pois: [] }]);
  }

  function addToActiveDay(p: CityPOI, e?: React.MouseEvent | React.KeyboardEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (placedIds.has(p.id)) {
      setDays((d) => d.map((x) => ({ ...x, pois: x.pois.filter((q) => q.id !== p.id) })));
      return;
    }
    setDays((d) => d.map((x, i) => (i === activeDayIdx ? { ...x, pois: [...x.pois, p] } : x)));
  }

  function saveAsDraft() {
    let count = 0;
    for (const d of days) {
      for (const p of d.pois) {
        addToTripDraft({
          kind: "poi",
          id: p.id,
          name: p.name,
          city_slug: citySlug,
          image_url: p.image_url ?? null,
        });
        count++;
      }
    }
    if (count > 0) router.push("/trip/draft");
  }

  function autofill() {
    if (filteredPois.length === 0) return;
    const top = [...filteredPois]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .filter((p) => !placedIds.has(p.id));
    setDays((current) => {
      const next = current.map((d) => ({ ...d }));
      let cursor = 0;
      for (const p of top) {
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
    <div className="min-h-[calc(100vh-56px)]" style={{ background: "#F8F7F4" }}>
      {/* Sub-header: city + tabs + mic */}
      <div className="sticky top-14 z-40 backdrop-blur" style={{ background: "rgba(15,23,42,0.96)", color: "white" }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link href="/georgia" className="text-white/80 hover:text-white text-lg">←</Link>
          <div className="min-w-0">
            <div
              className="font-bold text-lg leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {cityName}
            </div>
            <div className="text-xs text-white/60">{pois.length} мест</div>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-auto p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
            {TAB_LABELS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                style={{
                  background: tab === t.value ? "white" : "transparent",
                  color: tab === t.value ? "#0F172A" : "rgba(255,255,255,0.7)",
                }}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleVoice}
            aria-label="Голосовой поиск"
            className="w-9 h-9 rounded-full flex items-center justify-center transition ml-auto md:ml-0"
            style={{
              background: listening ? "#FF6B1B" : "rgba(255,255,255,0.08)",
              color: "white",
              animation: listening ? "pulse 1.2s ease-in-out infinite" : undefined,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>
        {/* Mobile tabs row */}
        <div className="md:hidden border-t border-white/10">
          <div className="max-w-screen-2xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto">
            {TAB_LABELS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                style={{
                  background: tab === t.value ? "white" : "rgba(255,255,255,0.08)",
                  color: tab === t.value ? "#0F172A" : "rgba(255,255,255,0.7)",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div className="max-w-screen-2xl mx-auto px-4 py-5">
        <div
          className={
            "grid gap-5 " +
            (showLeft && showRight
              ? "grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
              : "grid-cols-1")
          }
        >
          {/* LEFT — POI grid */}
          {showLeft && (
            <div>
              {/* Search */}
              <div className="mb-3 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={listening ? "Слушаю…" : "🔎 Поиск по местам..."}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "white",
                    border: "1px solid " + (listening ? "#FF6B1B" : "#E5E7EB"),
                  }}
                />
              </div>
              {/* Filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition"
                    style={{
                      background: filter === f.value ? "var(--blue)" : "white",
                      color: filter === f.value ? "white" : "#0F172A",
                      border: "1px solid " + (filter === f.value ? "var(--blue)" : "#E5E7EB"),
                    }}
                  >
                    {f.emoji && <span className="mr-1">{f.emoji}</span>}
                    {f.label}
                  </button>
                ))}
              </div>
              {/* POI grid */}
              {filteredPois.length === 0 ? (
                <div className="text-center text-gray-500 py-12">Ничего не найдено</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredPois.map((p) => {
                    const cat = categoryLabel(p.category);
                    const placed = placedIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className="group relative rounded-2xl overflow-hidden bg-white transition hover:shadow-xl"
                        style={{
                          border: placed ? "2px solid var(--blue)" : "1px solid #E5E7EB",
                        }}
                      >
                        {/* CARD as link to detail */}
                        <Link href={poiHref(p)} className="block">
                          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                            {p.image_url ? (
                              <img
                                src={absUrl(p.image_url)}
                                alt={p.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-4xl">
                                {cat.emoji}
                              </div>
                            )}
                            <div
                              className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: "rgba(15,23,42,0.85)", color: "white" }}
                            >
                              {cat.emoji} {cat.label}
                            </div>
                          </div>
                          <div className="p-3">
                            <div
                              className="font-bold text-sm leading-tight mb-1.5"
                              style={{ color: "#0F172A" }}
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
                        </Link>
                        {/* Action buttons: in draft (🧭) + in active day (+) */}
                        <div className="absolute top-2 right-2 flex flex-row-reverse gap-1.5">
                          <button
                            onClick={(e) => addToActiveDay(p, e)}
                            aria-label={placed ? "Убрать из дня" : "Добавить в день"}
                            title={placed ? "В этом дне — нажмите чтобы убрать" : "Добавить в активный день"}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                            style={{
                              background: placed ? "var(--blue)" : "rgba(255,255,255,0.95)",
                              color: placed ? "white" : "#0F172A",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              fontSize: 18,
                            }}
                        >
                          {placed ? "✓" : "+"}
                        </button>
                          <button
                            onClick={(e) => toggleDraft(p, e)}
                            aria-label={draftPoiIds.has(p.id) ? "Убрать из маршрута" : "В маршрут"}
                            title={draftPoiIds.has(p.id) ? "В маршруте — нажмите чтобы убрать" : "Добавить в маршрут"}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                            style={{
                              background: draftPoiIds.has(p.id) ? "#10B981" : "rgba(255,255,255,0.95)",
                              color: draftPoiIds.has(p.id) ? "white" : "#0F172A",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              fontSize: 14,
                            }}
                          >
                            {draftPoiIds.has(p.id) ? "✓" : "🧭"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Restaurants carousel */}
              {restaurants.length > 0 && (
                <section className="mt-10">
                  <div className="flex items-end justify-between gap-2 mb-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Гастрономия</div>
                      <h3
                        className="font-extrabold leading-tight"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: 22,
                          color: "#0F172A",
                        }}
                      >
                        Куда поесть
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => restCarouselRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
                        className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"
                        style={{ borderColor: "#E5E7EB" }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => restCarouselRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
                        className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"
                        style={{ borderColor: "#E5E7EB" }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <div ref={restCarouselRef} className="flex gap-3 overflow-x-auto pb-3 snap-x">
                    {restaurants.map((r) => (
                      <Link
                        key={r.id}
                        href={poiHref(r)}
                        className="group shrink-0 w-48 snap-start rounded-2xl overflow-hidden bg-white"
                        style={{ border: "1px solid #E5E7EB" }}
                      >
                        <div className="relative aspect-[3/4] bg-gray-100">
                          <img
                            src={absUrl(r.image_url)}
                            alt={r.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                            <div
                              className="font-bold text-sm leading-tight"
                              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                            >
                              {r.name}
                            </div>
                            {r.rating ? (
                              <div className="text-[11px] text-white/80 mt-1">⭐ {r.rating}</div>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Events */}
              {upcomingEvents.length > 0 && (
                <section className="mt-10">
                  <div className="mb-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Афиша</div>
                    <h3
                      className="font-extrabold leading-tight"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: 22,
                        color: "#0F172A",
                      }}
                    >
                      Что в городе сейчас
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {upcomingEvents.map((e) => {
                      const date = formatDate(e.event_date);
                      const t = EVENT_TYPE_LABEL[e.event_type] || EVENT_TYPE_LABEL.other;
                      return (
                        <div
                          key={e.id}
                          className="group flex gap-2 rounded-2xl overflow-hidden bg-white transition hover:shadow-lg"
                          style={{ border: "1px solid #E5E7EB" }}
                        >
                          {date && (
                            <div
                              className="shrink-0 w-16 flex flex-col items-center justify-center text-center py-2"
                              style={{ background: t.color + "12" }}
                            >
                              <div
                                className="font-extrabold leading-none"
                                style={{
                                  fontFamily: 'Georgia, "Times New Roman", serif',
                                  fontSize: 26,
                                  color: t.color,
                                }}
                              >
                                {date.day}
                              </div>
                              <div
                                className="text-[10px] uppercase mt-0.5"
                                style={{ color: t.color }}
                              >
                                {date.month}
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0 py-2 pr-2 flex flex-col">
                            <div
                              className="text-[10px] font-bold uppercase tracking-wider mb-1"
                              style={{ color: t.color }}
                            >
                              {t.emoji} {t.label}
                            </div>
                            <div
                              className="font-bold text-xs leading-tight line-clamp-2 mb-1.5"
                              style={{ color: "#0F172A" }}
                            >
                              {e.name}
                            </div>
                            <div className="mt-auto flex flex-wrap items-center gap-1">
                              <AddToTripButton
                                item={{
                                  kind: "event",
                                  id: e.id,
                                  name: e.name,
                                  event_date: e.event_date,
                                  event_time: e.event_time,
                                  event_type: e.event_type,
                                  image_url: e.image_url,
                                  ticket_url: e.ticket_url,
                                }}
                              />
                              {e.ticket_url && (
                                <a
                                  href={e.ticket_url}
                                  target="_blank"
                                  rel="noopener"
                                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition hover:opacity-80"
                                  style={{ background: "#F3F4F6", color: "#0F172A" }}
                                >
                                  Билет ↗
                                </a>
                              )}
                            </div>
                          </div>
                          {e.image_url && (
                            <div className="hidden sm:block shrink-0 w-16 bg-gray-100">
                              <img
                                src={e.image_url}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* RIGHT — Planner */}
          {showRight && (
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="font-bold text-sm flex items-center gap-2"
                  style={{ color: "#0F172A" }}
                >
                  📋 Маршрут
                </div>
                <button
                  onClick={addDay}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "white", border: "1px solid #E5E7EB", color: "#0F172A" }}
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
                <button
                  onClick={saveAsDraft}
                  disabled={placedIds.size === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                  style={{ background: "var(--blue, #2563EB)" }}
                  title="Сохранить как черновик маршрута"
                >
                  💾 В маршрут ({placedIds.size})
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {days.map((d, i) => {
                  const color = DAY_COLORS[i % DAY_COLORS.length];
                  const active = activeDayIdx === i;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setActiveDayIdx(i)}
                      className="rounded-2xl p-3 cursor-pointer transition"
                      style={{
                        background: active ? color + "12" : "white",
                        border: `2px ${active ? "solid" : "dashed"} ${color}`,
                        minHeight: 200,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="font-bold text-sm" style={{ color: "#0F172A" }}>
                            День {i + 1}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDays((all) => all.filter((_, j) => j !== i));
                            if (activeDayIdx >= days.length - 1) setActiveDayIdx(0);
                          }}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      {d.pois.length === 0 ? (
                        <div
                          className="flex items-center justify-center text-xs text-center py-10 px-2 rounded-lg"
                          style={{ color, background: color + "08" }}
                        >
                          {active ? "Жми + на карточке" : "Кликни сюда → активный день"}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {d.pois.map((p, j) => (
                            <Link
                              key={p.id}
                              href={poiHref(p)}
                              className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-white"
                              style={{ background: color + "10" }}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ background: color }}
                              >
                                {j + 1}
                              </span>
                              <span className="flex-1 truncate" style={{ color: "#0F172A" }}>
                                {p.name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
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
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
