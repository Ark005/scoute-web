"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useCallback, type ReactNode } from "react";
import { CityPOI, CityWeather } from "@/lib/types";
import { CityEntry } from "@/lib/cities-data";

const CityDayPlanner = dynamic(() => import("./CityDayPlanner"), { ssr: false });

// ── helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  history: "🏛", museum: "🏛", restaurant: "🍽", cafe: "☕",
  hotels: "🏨", park: "🌳", viewpoint: "🌄", church: "⛪",
  nature: "🌿", gallery: "🎨", theater: "🎭", monument: "🗿",
  restaurants: "🍽", attraction: "🏛", entertainment: "🎉",
  architecture: "🏗", culture: "🎭", religion: "⛪",
};

const CATEGORY_RU: Record<string, string> = {
  history: "История", museum: "Музеи", restaurant: "Рестораны",
  restaurants: "Рестораны", cafe: "Кафе", hotels: "Отели",
  park: "Парки", viewpoint: "Смотровые", church: "Церкви",
  nature: "Природа", gallery: "Галереи", theater: "Театры",
  monument: "Монументы", attraction: "Достопримечательности",
  entertainment: "Развлечения", architecture: "Архитектура",
  culture: "Культура", religion: "Религия",
};

const CATEGORY_PASTELS: Record<string, string> = {
  history: "#FEF3C7", museum: "#EDE9FE", restaurant: "#FEE2E2",
  restaurants: "#FEE2E2", cafe: "#FEF9C3", park: "#DCFCE7",
  nature: "#DCFCE7", church: "#F0F9FF", religion: "#F0F9FF",
  gallery: "#FCE7F3", theater: "#FCE7F3", culture: "#FCE7F3",
  viewpoint: "#E0F2FE", monument: "#F3F4F6", architecture: "#FFF7ED",
  entertainment: "#FDF4FF", hotels: "#F0FDF4",
};

function categoryPastel(cat: string): string {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_PASTELS)) {
    if (key.includes(k)) return v;
  }
  return "#F9FAFB";
}

function categoryIcon(cat: string): string {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "📍";
}

function categoryRu(cat: string): string {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_RU)) {
    if (key.includes(k)) return v;
  }
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestRestaurant(poi: CityPOI, restaurants: CityPOI[]): CityPOI | null {
  if (poi.latitude == null || poi.longitude == null) return null;
  let nearest: CityPOI | null = null;
  let minDist = Infinity;
  for (const r of restaurants) {
    if (r.latitude == null || r.longitude == null) continue;
    const d = haversine(poi.latitude!, poi.longitude!, r.latitude!, r.longitude!);
    if (d < minDist) { minDist = d; nearest = r; }
  }
  return nearest;
}

function getOpeningHoursStr(poi: CityPOI): string | null {
  const oh = poi.opening_hours;
  if (!oh) return null;
  if (typeof oh === "string") return oh || null;
  return oh.hours ?? null;
}

function getClosedStatus(poi: CityPOI): { closed: boolean } {
  const oh = poi.opening_hours;
  if (!oh || typeof oh === "string") return { closed: false };
  return { closed: !!oh.closed };
}

type ViewMode = "cards" | "board" | "split";

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string }

function Toast({ messages }: { messages: ToastMsg[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {messages.map(m => (
        <div key={m.id} className="px-4 py-2 rounded-xl shadow-lg text-white text-xs font-semibold" style={{ background: "#1d4ed8", opacity: 0.95 }}>
          {m.text}
        </div>
      ))}
    </div>
  );
}

// ── Sticky selection bar ──────────────────────────────────────────────────────

function SelectionBar({ count, onMoveToplan, onClear }: { count: number; onMoveToplan: () => void; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 py-3 border-t shadow-lg" style={{ background: "white", borderColor: "#e5e7eb" }}>
      <span className="text-xs font-semibold" style={{ color: "var(--dark)" }}>✓ Выбрано: {count}</span>
      <div className="flex items-center gap-2">
        <button onClick={onMoveToplan} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: "var(--blue)" }}>
          → Перенести в план
        </button>
        <button onClick={onClear} className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:bg-gray-50" style={{ borderColor: "#e5e7eb", color: "var(--grey)" }}>
          × Очистить
        </button>
      </div>
    </div>
  );
}

// ── Audio guide ───────────────────────────────────────────────────────────────

function useAudioGuide(text: string) {
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    if (playing) {
      synth.cancel();
      setPlaying(false);
      return;
    }

    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ru-RU";
    utter.rate = 0.95;

    // Try to pick a Russian voice
    const voices = synth.getVoices();
    const ruVoice = voices.find(v => v.lang.startsWith("ru"));
    if (ruVoice) utter.voice = ruVoice;

    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    synth.speak(utter);
    setPlaying(true);
  }, [playing, text]);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  return { playing, toggle, stop };
}

// ── POI Detail Panel (Flutter-style) ─────────────────────────────────────────

function POIDetailPanel({ poi, inPlan, onToggle, onBack }: {
  poi: CityPOI;
  inPlan: boolean;
  onToggle: () => void;
  onBack: () => void;
}) {
  const icon = categoryIcon(poi.category);
  const pastel = categoryPastel(poi.category);
  const hasPhoto = Boolean(poi.image_url);
  const hoursStr = getOpeningHoursStr(poi);
  const closedStatus = getClosedStatus(poi);

  // Build audio script: name + description + tip
  const audioText = [
    poi.name,
    poi.description,
    poi.tip ? `Совет: ${poi.tip}` : null,
    hoursStr && !closedStatus.closed ? `Часы работы: ${hoursStr}` : null,
    closedStatus.closed ? "Сейчас закрыто." : null,
  ].filter(Boolean).join(". ");

  const audio = useAudioGuide(audioText);

  // Museums / galleries — show audio guide
  const hasAudioGuide = Boolean(poi.description) && (
    ["museum", "gallery", "history", "church", "monument", "architecture", "culture", "religion"]
      .some(k => poi.category.toLowerCase().includes(k))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => { audio.stop(); onBack(); }}
          className="text-lg leading-none px-1 text-gray-500 hover:text-gray-800 transition"
          aria-label="Назад"
        >
          ←
        </button>
        <h2 className="font-bold text-sm flex-1 line-clamp-1" style={{ color: "var(--dark)" }}>{poi.name}</h2>
        {/* Audio guide button */}
        {hasAudioGuide && (
          <button
            onClick={audio.toggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition"
            style={{
              background: audio.playing ? "#ef4444" : "var(--blue)",
              color: "white",
            }}
            title={audio.playing ? "Стоп" : "Аудиогид"}
          >
            {audio.playing ? "⏹ Стоп" : "▶ Аудиогид"}
          </button>
        )}
      </div>

      {/* Photo / illustration */}
      <div className="relative flex-shrink-0" style={{ height: 200, background: hasPhoto ? "#e5e7eb" : pastel }}>
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poi.image_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl select-none">{icon}</span>
          </div>
        )}
        {poi.must_see && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "var(--orange)" }}>
            ★ Must see
          </span>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Rating */}
        {poi.rating && (
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="font-bold text-lg" style={{ color: "var(--dark)" }}>{poi.rating}</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {closedStatus.closed ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#16a34a", borderColor: "#bbf7d0", background: "#f0fdf4" }}>
              🕐 closed
            </span>
          ) : hoursStr ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#16a34a", borderColor: "#bbf7d0", background: "#f0fdf4" }}>
              🕐 {hoursStr}
            </span>
          ) : null}

          {poi.avg_check != null && poi.avg_check > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#374151", borderColor: "#e5e7eb", background: "white" }}>
              🍽 ~{poi.avg_check.toLocaleString("ru")} ₽
            </span>
          )}

          {poi.entrance_fee != null && poi.entrance_fee > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#374151", borderColor: "#e5e7eb", background: "white" }}>
              🎫 {poi.entrance_fee.toLocaleString("ru")} ₽
            </span>
          )}
          {(poi.free_entry || poi.entrance_fee === 0) && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#16a34a", borderColor: "#bbf7d0", background: "#f0fdf4" }}>
              🎫 Бесплатно
            </span>
          )}

          {poi.avg_time_min != null && poi.avg_time_min > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#374151", borderColor: "#e5e7eb", background: "white" }}>
              ⏱ {poi.avg_time_min < 60 ? `${poi.avg_time_min} мин` : `${Math.floor(poi.avg_time_min / 60)} ч ${poi.avg_time_min % 60 > 0 ? poi.avg_time_min % 60 + " мин" : ""}`}
            </span>
          )}

          {poi.cuisine_type && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: "#374151", borderColor: "#e5e7eb", background: "white" }}>
              {poi.cuisine_type}
            </span>
          )}
        </div>

        {/* Description */}
        {poi.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--dark)" }}>{poi.description}</p>
        )}

        {/* Tip */}
        {poi.tip && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">💡 {poi.tip}</p>
        )}

        {/* Address / phone */}
        {poi.address && <p className="text-sm" style={{ color: "var(--grey)" }}>📍 {poi.address}</p>}
        {poi.phone && <p className="text-sm" style={{ color: "var(--grey)" }}>📞 {poi.phone}</p>}
        {poi.price_range && <p className="text-sm" style={{ color: "var(--grey)" }}>💰 {poi.price_range}</p>}
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
        <button
          onClick={onToggle}
          className="w-full py-3 rounded-2xl font-bold text-sm text-white transition"
          style={{ background: inPlan ? "#059669" : "var(--blue)" }}
        >
          {inPlan ? "✓ В плане — убрать" : "⊕ Выбрать на доску"}
        </button>

        {/* Navigator button — opens Yandex Maps if coordinates available */}
        {poi.latitude != null && poi.longitude != null && (
          <a
            href={`https://yandex.ru/maps/?pt=${poi.longitude},${poi.latitude}&z=17&l=map`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border transition hover:bg-gray-50"
            style={{ color: "var(--dark)", borderColor: "#e5e7eb", background: "white" }}
          >
            🗺 Открыть в Яндекс.Картах
          </a>
        )}

        {/* Audio guide for restaurants too */}
        {!hasAudioGuide && poi.description && (
          <button
            onClick={audio.toggle}
            className="w-full py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border transition hover:bg-gray-50"
            style={{ color: audio.playing ? "#ef4444" : "var(--dark)", borderColor: audio.playing ? "#fca5a5" : "#e5e7eb" }}
          >
            {audio.playing ? "⏹ Стоп" : "▶ Озвучить описание"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── POI card (grid) ───────────────────────────────────────────────────────────

function POICard({ poi, inPlan, onToggle, onClick }: {
  poi: CityPOI;
  inPlan: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const icon = categoryIcon(poi.category);
  const pastel = categoryPastel(poi.category);
  const hasPhoto = Boolean(poi.image_url);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${inPlan ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-100"}`}
      onClick={onClick}
    >
      {/* Photo / illustration */}
      <div className="relative w-full overflow-hidden" style={{ height: 96, background: hasPhoto ? "#e5e7eb" : pastel }}>
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poi.image_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl select-none">{icon}</span>
          </div>
        )}

        {/* Category badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(0,0,0,0.45)", color: "white", backdropFilter: "blur(2px)" }}>
          {icon} {categoryRu(poi.category)}
        </span>

        {poi.must_see && (
          <span className="absolute top-2 right-8 px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: "var(--orange)" }}>
            ★
          </span>
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          style={{ background: inPlan ? "var(--blue)" : "rgba(255,255,255,0.9)", borderColor: inPlan ? "var(--blue)" : "#d1d5db" }}
        >
          {inPlan && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-2.5">
        <p className="font-bold text-xs leading-tight line-clamp-1" style={{ color: "var(--dark)" }}>{poi.name}</p>

        {/* Preview: rating + time */}
        <div className="flex gap-1.5 mt-1 text-[10px] flex-wrap" style={{ color: "var(--grey)" }}>
          {poi.rating && <span>⭐ {poi.rating}</span>}
          {poi.avg_time_min != null && poi.avg_time_min > 0 && (
            <span>⏱ {poi.avg_time_min < 60 ? `${poi.avg_time_min}м` : `${Math.floor(poi.avg_time_min / 60)}ч`}</span>
          )}
          {poi.avg_check != null && poi.avg_check > 0 && (
            <span>~{poi.avg_check.toLocaleString("ru")} ₽</span>
          )}
          {poi.entrance_fee != null && poi.entrance_fee > 0 && (
            <span>🎫 {poi.entrance_fee} ₽</span>
          )}
          {(poi.free_entry || poi.entrance_fee === 0) && (
            <span className="text-green-600">Бесплатно</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── View mode icons ───────────────────────────────────────────────────────────

function IconCards() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="6" height="6" rx="1" /><rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" /><rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  );
}

function IconBoard() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="0" y="0" width="14" height="3" rx="1" /><rect x="0" y="5.5" width="14" height="3" rx="1" />
      <rect x="0" y="11" width="14" height="3" rx="1" />
    </svg>
  );
}

function IconSplit() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
      <rect x="0" y="0" width="6" height="6" rx="1" /><rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="9" y="0" width="7" height="14" rx="1" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4l5-2 6 3 5-2v11l-5 2-6-3-5 2V4z" /><path d="M6 2v11M12 5v11" />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  city: CityEntry;
  pois: CityPOI[];
  error?: string;
  weather?: CityWeather;
}

let toastSeq = 0;

export default function CityGuide({ city, pois, error, weather }: Props) {
  const [view, setView] = useState<ViewMode>("split");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [planIds, setPlanIds] = useState<Set<number>>(new Set());
  const [mobileTab, setMobileTab] = useState<"cards" | "board">("cards");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<CityPOI | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of pois) seen.add(p.category);
    return Array.from(seen).sort();
  }, [pois]);

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? pois : pois.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [pois, activeCategory, search]);

  const filteredAttractions = useMemo(() => filtered.filter(p => p.type !== "restaurant"), [filtered]);
  const filteredRestaurants = useMemo(() => filtered.filter(p => p.type === "restaurant"), [filtered]);
  const planPois = useMemo(() => pois.filter(p => planIds.has(p.id)), [pois, planIds]);

  const showToast = useCallback((text: string) => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const togglePlan = useCallback((id: number) => {
    const poi = pois.find(p => p.id === id);
    if (!poi) return;
    setPlanIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
        if (poi.type !== "restaurant") {
          const restaurants = pois.filter(p => p.type === "restaurant" && !s.has(p.id));
          const nearest = findNearestRestaurant(poi, restaurants);
          if (nearest) {
            s.add(nearest.id);
            setTimeout(() => showToast(`Добавлен ближайший ресторан: ${nearest.name}`), 0);
          }
        }
      }
      return s;
    });
  }, [pois, showToast]);

  const removeFromPlan = useCallback((id: number) => {
    setPlanIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  }, []);

  const clearPlan = useCallback(() => setPlanIds(new Set()), []);

  const moveToPlan = useCallback(() => {
    setMobileTab("board");
    setView(v => v === "cards" ? "split" : v);
  }, []);

  const autoFill = useCallback(() => {
    const candidates = pois
      .filter(p => !planIds.has(p.id))
      .sort((a, b) => {
        if (a.must_see && !b.must_see) return -1;
        if (!a.must_see && b.must_see) return 1;
        return (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, 15);
    setPlanIds(prev => new Set([...prev, ...candidates.map(p => p.id)]));
  }, [pois, planIds]);

  const VIEW_MODES: { key: ViewMode; label: string; icon: ReactNode }[] = [
    { key: "cards",  label: "Карточки",    icon: <IconCards /> },
    { key: "board",  label: "Доска",       icon: <IconBoard /> },
    { key: "split",  label: "Объединённый", icon: <IconSplit /> },
  ];

  const showCards = view === "cards" || view === "split";
  const showBoard = view === "board" || view === "split";

  // ── Cards grid (shared) ───────────────────────────────────────────────────

  function CardsGrid({ cols }: { cols: string }) {
    return (
      <>
        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--grey)" }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по местам..."
              className="w-full pl-8 pr-4 py-2 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#e5e7eb", background: "white", color: "var(--dark)" }}
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition"
            style={{ background: activeCategory === "all" ? "var(--blue)" : "white", color: activeCategory === "all" ? "white" : "var(--dark)", borderColor: activeCategory === "all" ? "var(--blue)" : "#e5e7eb" }}
          >
            Все
          </button>
          {categories.map(cat => {
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition"
                style={{ background: active ? "var(--blue)" : "white", color: active ? "white" : "var(--dark)", borderColor: active ? "var(--blue)" : "#e5e7eb" }}
              >
                {categoryIcon(cat)} {categoryRu(cat)}
              </button>
            );
          })}
        </div>

        {/* POI grid */}
        <div className={`px-4 pb-4 pt-2 ${planIds.size > 0 ? "pb-20" : ""}`}>
          <div className={`grid gap-3 ${cols}`}>
            {filteredAttractions.map(poi => (
              <POICard key={poi.id} poi={poi} inPlan={planIds.has(poi.id)} onToggle={() => togglePlan(poi.id)} onClick={() => setSelectedPoi(poi)} />
            ))}
          </div>

          {filteredRestaurants.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm font-bold" style={{ color: "var(--dark)" }}>🍽 Рестораны</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className={`grid gap-3 ${cols}`}>
                {filteredRestaurants.map(poi => (
                  <POICard key={poi.id} poi={poi} inPlan={planIds.has(poi.id)} onToggle={() => togglePlan(poi.id)} onClick={() => setSelectedPoi(poi)} />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--grey)" }}>
              Ничего не найдено
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div style={{ background: "#111827" }} className="px-5 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/70 hover:text-white transition text-lg leading-none" aria-label="Назад">←</Link>
            <div>
              <h1 className="text-white text-base font-extrabold leading-tight">{city.name}</h1>
              <p className="text-white/50 text-xs">{pois.length} места</p>
            </div>
          </div>
          <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition" aria-label="Карта">
            <IconMap />
          </button>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-0 bg-white/10 rounded-xl p-1 w-fit">
          {VIEW_MODES.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setView(key); setSelectedPoi(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative"
              style={{ background: view === key ? "white" : "transparent", color: view === key ? "var(--dark)" : "rgba(255,255,255,0.65)" }}
            >
              {icon}
              {label}
              {view === key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: "var(--blue)" }} />
              )}
            </button>
          ))}
        </div>

        {/* Mobile tabs */}
        <div className="flex gap-1 mt-2 bg-white/10 rounded-xl p-1 w-fit lg:hidden">
          <button onClick={() => setMobileTab("cards")} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{ background: mobileTab === "cards" ? "white" : "transparent", color: mobileTab === "cards" ? "var(--dark)" : "rgba(255,255,255,0.7)" }}>
            🗂 Места ({pois.length})
          </button>
          <button onClick={() => setMobileTab("board")} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{ background: mobileTab === "board" ? "white" : "transparent", color: mobileTab === "board" ? "var(--dark)" : "rgba(255,255,255,0.7)" }}>
            📋 План ({planIds.size})
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          ⚠️ {error}
        </div>
      )}

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">

        {/* Left panel */}
        {showCards && (
          <div className={`flex flex-col overflow-hidden ${showBoard ? "flex-1" : "w-full max-w-screen-xl mx-auto"}`}>
            {selectedPoi ? (
              <POIDetailPanel
                poi={selectedPoi}
                inPlan={planIds.has(selectedPoi.id)}
                onToggle={() => togglePlan(selectedPoi.id)}
                onBack={() => setSelectedPoi(null)}
              />
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col">
                <CardsGrid cols={showBoard ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-3 xl:grid-cols-4"} />
              </div>
            )}
          </div>
        )}

        {/* Right panel — planner */}
        {showBoard && (
          <div
            className={`overflow-y-auto px-4 py-4 border-l border-gray-200 ${showCards ? "w-[640px] shrink-0" : "flex-1"}`}
            style={{ background: "white" }}
          >
            <CityDayPlanner pois={planPois} onRemove={removeFromPlan} onAutoFill={autoFill} weather={weather} />
            {planPois.length === 0 && (
              <p className="text-xs text-center mt-8" style={{ color: "var(--grey)" }}>
                Нажми на карточку и выбери место, или ✨ Автозаполнение
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
        {mobileTab === "cards" && (
          <div className="flex-1 overflow-y-auto">
            {selectedPoi ? (
              <POIDetailPanel
                poi={selectedPoi}
                inPlan={planIds.has(selectedPoi.id)}
                onToggle={() => togglePlan(selectedPoi.id)}
                onBack={() => setSelectedPoi(null)}
              />
            ) : (
              <CardsGrid cols="grid-cols-2" />
            )}
          </div>
        )}
        {mobileTab === "board" && (
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <CityDayPlanner pois={planPois} onRemove={removeFromPlan} onAutoFill={autoFill} weather={weather} />
          </div>
        )}
      </div>

      {/* Sticky selection bar */}
      <SelectionBar count={planIds.size} onMoveToplan={moveToPlan} onClear={clearPlan} />

      {/* Toast */}
      <Toast messages={toasts} />
    </div>
  );
}
