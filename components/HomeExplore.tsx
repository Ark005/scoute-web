"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { RouteListItem } from "@/lib/types";
import { REGION_LABELS } from "@/lib/regions";
import { CITIES } from "@/lib/cities-data";

const HomeMap = dynamic(() => import("./HomeMap"), { ssr: false });

// ── Voice search ─────────────────────────────────────────────────────────────

function useSpeechSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);

  const start = useCallback(() => {
    const Rec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Rec) { alert("Голосовой поиск не поддерживается браузером"); return; }

    const rec = new Rec();
    rec.lang = "ru-RU";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    rec.start();
  }, [onResult]);

  return { listening, start };
}

// ── Haversine ─────────────────────────────────────────────────────────────────

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

// ── Route card (list style) ───────────────────────────────────────────────────

const ROUTE_ICONS: Record<string, string> = {
  Кавказ: "⛰️", Georgia: "🍷", Сибирь: "🌲", Байкал: "💧",
  Алтай: "🏔️", Крым: "🌊", Урал: "⛰️", Карелия: "🌲",
  Европа: "🗺️", СНГ: "🌐", Азия: "🌏",
};

function routeIcon(route: RouteListItem): string {
  const tags = (route.tags ?? []).join(" ").toLowerCase();
  if (tags.includes("природа") || tags.includes("nature")) return "🌿";
  if (tags.includes("море") || tags.includes("пляж")) return "🌊";
  if (tags.includes("горы") || tags.includes("треккинг")) return "⛰️";
  if (tags.includes("история") || tags.includes("юнеско")) return "🏛️";
  if (tags.includes("гастро") || tags.includes("вино")) return "🍷";
  for (const [k, v] of Object.entries(ROUTE_ICONS)) {
    if (route.region.includes(k)) return v;
  }
  return "🚗";
}

function RouteCard({
  route,
  active,
  distFromUser,
  onClick,
}: {
  route: RouteListItem;
  active?: boolean;
  distFromUser?: number;
  onClick: () => void;
}) {
  const hasPhoto = Boolean(route.cover_image);
  const icon = routeIcon(route);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
        active
          ? "border-orange-400 bg-orange-50 shadow-sm"
          : "border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm"
      }`}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl"
        style={{ background: hasPhoto ? "#e5e7eb" : "#EFF6FF" }}
      >
        {hasPhoto ? (
          <Image src={route.cover_image} alt={route.title} width={56} height={56} className="object-cover w-full h-full" unoptimized />
        ) : (
          <span>{icon}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm leading-snug line-clamp-1" style={{ color: "var(--dark)" }}>
            {route.title}
          </p>
          {route.is_free ? (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#DCFCE7", color: "#15803D" }}>FREE</span>
          ) : route.price_rub > 0 ? (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#FEF3C7", color: "#92400E" }}>{route.price_rub} ₽</span>
          ) : null}
        </div>

        <p className="text-xs line-clamp-2 mt-0.5 leading-snug" style={{ color: "var(--grey)" }}>
          {route.region}
          {distFromUser != null && ` · ${Math.round(distFromUser)} км от вас`}
        </p>

        <p className="text-xs line-clamp-2 mt-1 leading-snug" style={{ color: "#4B5563" }}>
          {route.waypoints_preview?.[0]?.description?.slice(0, 120) || ""}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: "var(--grey)" }}>
          <span>🚗 {route.distance_km} км</span>
          <span>📅 {route.duration_days} дн.</span>
          <span>📍 {route.waypoints_preview?.length ?? 0} точек</span>
        </div>
      </div>
    </div>
  );
}

// ── Pill button ───────────────────────────────────────────────────────────────

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap"
      style={{
        background: active ? "var(--dark)" : "white",
        color: active ? "white" : "var(--dark)",
        border: `1px solid ${active ? "var(--dark)" : "#e5e7eb"}`,
      }}
    >
      {children}
    </button>
  );
}

// ── Region icons ──────────────────────────────────────────────────────────────

const REGION_ICONS: Record<string, string> = {
  moscow_region: "🏙️",
  central: "🏰",
  south: "☀️",
  caucasus: "⛰️",
  siberia: "🌲",
  ural: "🗻",
  volga: "🌊",
  northwest: "🧊",
  cis: "🌐",
  europe: "🗺️",
  far_east: "🦅",
  mideast: "🕌",
  asia: "🌏",
};

// ── Distance options ──────────────────────────────────────────────────────────

const DISTANCES = [
  { label: "От вас", value: -1 },
  { label: "до 50 км", value: 50 },
  { label: "до 100 км", value: 100 },
  { label: "до 200 км", value: 200 },
  { label: "до 500 км", value: 500 },
  { label: "до 1000 км", value: 1000 },
  { label: "до 2000 км", value: 2000 },
];

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  routes: RouteListItem[];
}

export default function HomeExplore({ routes }: Props) {
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [maxDist, setMaxDist] = useState<number>(0);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Voice search
  const speech = useSpeechSearch((text) => setSearch(text));

  // Get geolocation
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMaxDist(-1);
        setGeoLoading(false);
      },
      () => { setGeoLoading(false); }
    );
  }, []);

  // Collect unique regions from routes
  const regions = useMemo(() => {
    const seen = new Set<string>();
    for (const r of routes) if (r.region) seen.add(r.region);
    return Array.from(seen).sort((a, b) => a.localeCompare(b, "ru"));
  }, [routes]);

  // Unique region keys from REGION_LABELS
  const regionKeys = useMemo(
    () => Object.keys(REGION_LABELS),
    []
  );

  // Distance from user to route start
  const routeDistFromUser = useCallback((route: RouteListItem): number => {
    if (!userPos) return 0;
    const wp = route.waypoints_preview?.[0];
    if (!wp?.latitude || !wp?.longitude) return 0;
    return haversine(userPos.lat, userPos.lng, wp.latitude, wp.longitude);
  }, [userPos]);

  // Filter routes
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes
      .filter((r) => {
        if (q && !r.title.toLowerCase().includes(q) && !r.region.toLowerCase().includes(q) && !(r.tags ?? []).some(t => t.toLowerCase().includes(q))) return false;
        if (activeRegion !== "all") {
          // Match by REGION_LABELS key
          if (REGION_LABELS[activeRegion]) {
            if (!r.region.toLowerCase().includes(REGION_LABELS[activeRegion].toLowerCase()) &&
                !r.region.toLowerCase().includes(activeRegion.toLowerCase())) return false;
          } else {
            if (!r.region.toLowerCase().includes(activeRegion.toLowerCase())) return false;
          }
        }
        if (maxDist === -1 && userPos) {
          return routeDistFromUser(r) <= 600;
        }
        if (maxDist > 0 && r.distance_km > maxDist) return false;
        return true;
      })
      .sort((a, b) => {
        if (maxDist === -1 && userPos) return routeDistFromUser(a) - routeDistFromUser(b);
        return 0;
      });
  }, [routes, search, activeRegion, maxDist, userPos, routeDistFromUser]);

  const activeRoute = useMemo(
    () => (activeSlug ? routes.find(r => r.slug === activeSlug) ?? null : null),
    [activeSlug, routes]
  );

  // City search results
  const cityResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 4);
  }, [search]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Search + filter bar ── */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb" }} className="flex-shrink-0">
        {/* Search row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: "#9CA3AF" }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Байкал, Алтай, выходные..."
              className="w-full pl-9 pr-10 py-2.5 rounded-2xl border text-sm outline-none transition"
              style={{ borderColor: "#e5e7eb", background: "#F9FAFB", color: "var(--dark)" }}
            />
            {/* Mic button */}
            <button
              onClick={speech.start}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base transition"
              style={{ color: speech.listening ? "#EF4444" : "#9CA3AF" }}
              title="Голосовой поиск"
            >
              {speech.listening ? "⏹" : "🎙"}
            </button>
          </div>
          <span className="text-xs whitespace-nowrap" style={{ color: "var(--grey)" }}>
            {filtered.length} маршрутов
          </span>
          <Link href="/routes" className="text-xs font-semibold" style={{ color: "var(--blue)" }}>Все →</Link>
        </div>

        {/* Region pills */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
          <Pill active={activeRegion === "all"} onClick={() => setActiveRegion("all")}>
            🌍 Все
          </Pill>
          {regionKeys.map(key => (
            <Pill key={key} active={activeRegion === key} onClick={() => setActiveRegion(key)}>
              {REGION_ICONS[key] ?? "📍"} {REGION_LABELS[key]}
            </Pill>
          ))}
        </div>

        {/* Distance pills */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none">
          {DISTANCES.map(d => (
            <Pill
              key={d.value}
              active={maxDist === d.value}
              onClick={() => {
                if (d.value === -1) { getLocation(); }
                else setMaxDist(d.value);
              }}
            >
              {d.value === -1
                ? (geoLoading ? "⏳ Определяем..." : "📍 От вас")
                : d.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Route list */}
        <div
          ref={listRef}
          className="overflow-y-auto flex-shrink-0 flex flex-col"
          style={{ width: 420, borderRight: "1px solid #e5e7eb", background: "#F9FAFB" }}
        >
          <div className="py-2 px-2">
            {/* City results when searching */}
            {cityResults.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1.5" style={{ color: "var(--grey)" }}>
                  Городские гиды
                </p>
                {cityResults.map(city => (
                  <Link
                    key={city.slug}
                    href={`/cities/${city.slug}`}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-sm transition"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "#EFF6FF" }}>
                      {city.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: "var(--dark)" }}>{city.name}</p>
                      <p className="text-xs line-clamp-1" style={{ color: "var(--grey)" }}>{city.region}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: "var(--blue)" }}>Гид →</span>
                  </Link>
                ))}
                <div className="h-px bg-gray-200 my-2 mx-1" />
                <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1.5" style={{ color: "var(--grey)" }}>
                  Маршруты
                </p>
              </div>
            )}

            {filtered.length === 0 && cityResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-4xl mb-3">🗺️</span>
                <p className="text-sm font-semibold" style={{ color: "var(--dark)" }}>Ничего не найдено</p>
                <p className="text-xs mt-1" style={{ color: "var(--grey)" }}>Попробуй другой запрос</p>
              </div>
            ) : (
              filtered.map(route => (
                <RouteCard
                  key={route.slug}
                  route={route}
                  active={activeSlug === route.slug}
                  distFromUser={maxDist === -1 && userPos ? routeDistFromUser(route) : undefined}
                  onClick={() => setActiveSlug(s => s === route.slug ? null : route.slug)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Map */}
        <div className="flex-1 relative">
          <HomeMap routes={filtered} activeRoute={activeRoute} />
        </div>
      </div>
    </div>
  );
}
