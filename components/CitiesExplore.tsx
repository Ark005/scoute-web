"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CITIES, CityEntry } from "@/lib/cities-data";

const CitiesMap = dynamic(() => import("./CitiesMap"), { ssr: false });

// Coordinates for each city slug
const CITY_COORDS: Record<string, [number, number]> = {
  "moscow": [55.75, 37.62],
  "saint-petersburg": [59.94, 30.32],
  "kolomna": [55.10, 38.77],
  "vladimir": [56.13, 40.41],
  "suzdal": [56.42, 40.45],
  "yaroslavl": [57.63, 39.87],
  "kazan": [55.79, 49.12],
  "nizhny-novgorod": [56.33, 44.00],
  "tula": [54.19, 37.62],
  "veliky-novgorod": [58.52, 31.27],
  "pskov": [57.82, 28.33],
  "altai": [50.80, 86.50],
  "baikal": [53.50, 108.00],
  "sochi": [43.60, 39.73],
  "karelia": [62.00, 33.00],
  "tbilisi": [41.69, 44.83],
  "batumi": [41.64, 41.64],
  "yerevan": [40.18, 44.51],
  "samarkand": [39.66, 66.97],
  "istanbul": [41.01, 28.97],
  "prague": [50.08, 14.44],
  "vienna": [48.21, 16.37],
  "budapest": [47.50, 19.04],
  "berlin": [52.52, 13.41],
  "rome": [41.90, 12.49],
  "florence": [43.77, 11.26],
  "barcelona": [41.38, 2.17],
  "paris": [48.86, 2.35],
  "amsterdam": [52.37, 4.90],
  "dubai": [25.20, 55.27],
  "jerusalem": [31.77, 35.22],
  "tel-aviv": [32.07, 34.79],
  "cappadocia": [38.65, 34.85],
  "bangkok": [13.75, 100.52],
  "tokyo": [35.68, 139.69],
  "oslo": [59.91, 10.75],
};

const GROUPS = [
  { key: "all", label: "Все", emoji: "🌍" },
  { key: "russia", label: "Россия", emoji: "🇷🇺" },
  { key: "nature_ru", label: "Природа", emoji: "🏔️" },
  { key: "cis", label: "СНГ", emoji: "🌏" },
  { key: "europe", label: "Европа", emoji: "🗺️" },
  { key: "mideast", label: "Восток", emoji: "🕌" },
  { key: "asia", label: "Азия", emoji: "🌏" },
];

// Famous legendary routes (static)
const LEGENDARY_ROUTES = [
  { name: "Route 66", subtitle: "США — 3940 км", emoji: "🛣️", desc: "Легендарная трасса от Чикаго до Лос-Анджелеса. Мать всех дорог.", color: "#FF6B1B" },
  { name: "Гросглокнер", subtitle: "Австрия — 48 км", emoji: "⛰️", desc: "Высокогорная дорога через Альпы к леднику Пастерце. 3798 м.", color: "#3B82F6" },
  { name: "Ринг-роуд", subtitle: "Исландия — 1332 км", emoji: "🌋", desc: "Кольцо вокруг Исландии — гейзеры, лавовые поля, северное сияние.", color: "#22C55E" },
  { name: "Чуйский тракт", subtitle: "Алтай — 968 км", emoji: "🏔️", desc: "В топ-10 красивейших дорог мира. Горы, степи, Монголия.", color: "#A855F7" },
  { name: "Амальфитанское шоссе", subtitle: "Италия — 50 км", emoji: "🌊", desc: "Серпантин над Тирренским морем. Лимоны и рыбацкие деревни.", color: "#EC4899" },
  { name: "Каракорумское шоссе", subtitle: "Пакистан — 1300 км", emoji: "🗻", desc: "Самая высокогорная трасса мира. Три восьмитысячника рядом.", color: "#14B8A6" },
];

function CityCard({ city, active, onClick }: { city: CityEntry; active: boolean; onClick: () => void }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition"
      style={{
        background: active ? "#EFF6FF" : "white",
        border: `1.5px solid ${active ? "#3B82F6" : "#e5e7eb"}`,
        boxShadow: active ? "0 0 0 3px #BFDBFE" : "none",
      }}
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: active ? "#DBEAFE" : "#F3F4F6" }}
      >
        {city.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm" style={{ color: "#111827" }}>{city.name}</p>
          <Link
            href={`/cities/${city.slug}`}
            onClick={e => e.stopPropagation()}
            className="shrink-0 text-xs font-bold px-3 py-1 rounded-xl text-white transition hover:opacity-90"
            style={{ background: "#FF6B1B" }}
          >
            Открыть
          </Link>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{city.region}</p>
        <p className="text-xs mt-1 line-clamp-2" style={{ color: "#374151" }}>{city.teaser}</p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {city.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CitiesExplore() {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [showLegendary, setShowLegendary] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CITIES.filter(c => {
      const matchGroup = activeGroup === "all" || c.group === activeGroup;
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.teaser.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
  }, [search, activeGroup]);

  const activeCityEntry = activeCity ? CITIES.find(c => c.slug === activeCity) ?? null : null;

  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* ── Left panel ── */}
      <div className="flex flex-col overflow-hidden" style={{ width: 380, borderRight: "1px solid #e5e7eb", background: "#F9FAFB", flexShrink: 0 }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #e5e7eb", background: "white" }}>
          <h1 className="font-extrabold text-lg mb-0.5" style={{ color: "#111827" }}>Городские гиды</h1>
          <p className="text-xs" style={{ color: "#6B7280" }}>Достопримечательности, маршруты и советы</p>

          {/* Search */}
          <div className="relative mt-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "#9CA3AF" }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveGroup("all"); }}
              placeholder="Москва, Байкал, Прага..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#e5e7eb", background: "#F9FAFB", color: "#111827" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >×</button>
            )}
          </div>

          {/* Group filters */}
          <div className="flex gap-1.5 overflow-x-auto mt-3 scrollbar-none">
            {GROUPS.map(g => (
              <button
                key={g.key}
                onClick={() => { setActiveGroup(g.key); setSearch(""); }}
                className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border transition"
                style={{
                  background: activeGroup === g.key ? "#111827" : "white",
                  color: activeGroup === g.key ? "white" : "#374151",
                  borderColor: activeGroup === g.key ? "#111827" : "#e5e7eb",
                }}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legendary routes promo */}
        <button
          onClick={() => setShowLegendary(v => !v)}
          className="mx-4 mt-3 mb-1 flex items-center gap-3 px-4 py-3 rounded-2xl text-white transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #FF6B1B 0%, #FF8C42 100%)" }}
        >
          <span className="text-2xl">🛣️</span>
          <div className="text-left flex-1">
            <p className="font-bold text-sm">Вау-маршруты мира</p>
            <p className="text-xs opacity-80">Route 66, Гросглокнер, Ринг-роуд Исландии</p>
          </div>
          <span className="text-lg">{showLegendary ? "▲" : "▼"}</span>
        </button>

        {/* City list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
          {showLegendary ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide px-1 mb-1" style={{ color: "#6B7280" }}>
                Знаменитые дороги мира
              </p>
              {LEGENDARY_ROUTES.map(route => (
                <div
                  key={route.name}
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: "white", border: "1.5px solid #e5e7eb" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: route.color + "20" }}>
                    {route.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "#111827" }}>{route.name}</p>
                    <p className="text-xs font-medium" style={{ color: route.color }}>{route.subtitle}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "#6B7280" }}>{route.desc}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowLegendary(false)}
                className="text-xs text-center py-2" style={{ color: "#6B7280" }}
              >
                ← Показать города
              </button>
            </>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>Ничего не найдено по «{search}»</p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Попробуй другое название</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: "#9CA3AF" }}>
                {filtered.length} {filtered.length === 1 ? "город" : "городов"}
              </p>
              {filtered.map(city => (
                <CityCard
                  key={city.slug}
                  city={city}
                  active={activeCity === city.slug}
                  onClick={() => setActiveCity(s => s === city.slug ? null : city.slug)}
                />
              ))}
            </>
          )}
        </div>

        {/* Bottom: Routes link */}
        <div className="p-3 border-t border-gray-100" style={{ background: "white" }}>
          <Link
            href="/routes"
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-white font-bold text-sm transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" }}
          >
            <span>🚗 Маршруты по регионам</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* ── Right: Map ── */}
      <div className="flex-1 relative">
        <CitiesMap
          cities={filtered}
          coords={CITY_COORDS}
          activeSlug={activeCity}
          onSelect={setActiveCity}
        />

        {/* Active city overlay */}
        {activeCityEntry && (
          <div
            className="absolute bottom-4 left-4 right-4 z-[1000] flex items-center gap-3 p-3 rounded-2xl shadow-xl"
            style={{ background: "white", border: "2px solid #3B82F6" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: "#EFF6FF" }}>
              {activeCityEntry.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: "#111827" }}>{activeCityEntry.name}</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>{activeCityEntry.region}</p>
            </div>
            <Link
              href={`/cities/${activeCityEntry.slug}`}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: "#FF6B1B" }}
            >
              Открыть гид
            </Link>
            <button
              onClick={() => setActiveCity(null)}
              className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >×</button>
          </div>
        )}
      </div>
    </div>
  );
}
