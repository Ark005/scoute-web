"use client";

import { useState, useMemo } from "react";
import { RouteListItem } from "@/lib/types";
import RouteCard from "./RouteCard";

const DISTANCE_OPTIONS = [
  { label: "Все", value: 0 },
  { label: "до 50 км", value: 50 },
  { label: "до 100 км", value: 100 },
  { label: "до 150 км", value: 150 },
  { label: "до 200 км", value: 200 },
  { label: "до 300 км", value: 300 },
  { label: "до 500 км", value: 500 },
];

interface Props {
  initialRoutes: RouteListItem[];
}

export default function RouteCatalog({ initialRoutes }: Props) {
  const [maxDist, setMaxDist] = useState(0);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const regions = useMemo(() => {
    const set = new Set(initialRoutes.map((r) => r.region));
    return Array.from(set).sort();
  }, [initialRoutes]);

  const filtered = useMemo(() => {
    return initialRoutes.filter((r) => {
      if (maxDist > 0 && r.distance_km > maxDist) return false;
      if (regionFilter && r.region !== regionFilter) return false;
      if (
        search &&
        !r.title.toLowerCase().includes(search.toLowerCase()) &&
        !r.region.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [initialRoutes, maxDist, regionFilter, search]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--dark)" }} className="px-5 pt-12 pb-6">
        <h1 className="text-white text-2xl font-extrabold">Маршруты по России</h1>
        <p className="text-white/60 text-sm mt-1">
          Авторские автомаршруты — от Москвы до Байкала
        </p>
        {/* Search */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Поиск маршрута..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/20 transition"
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-4">
        {/* Distance chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DISTANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMaxDist(opt.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                maxDist === opt.value
                  ? "text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
              style={
                maxDist === opt.value
                  ? { background: "var(--blue)" }
                  : undefined
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Region chips */}
        {regions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mt-2 scrollbar-none">
            <button
              onClick={() => setRegionFilter("")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                !regionFilter
                  ? "text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
              style={!regionFilter ? { background: "var(--orange)" } : undefined}
            >
              Все регионы
            </button>
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r === regionFilter ? "" : r)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  regionFilter === r
                    ? "text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
                style={
                  regionFilter === r ? { background: "var(--orange)" } : undefined
                }
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <p className="text-sm mt-3 mb-4" style={{ color: "var(--grey)" }}>
          {filtered.length} маршрут{plural(filtered.length)}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--grey)" }}>
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-lg font-semibold">Маршрутов не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((route) => (
              <RouteCard key={route.slug} route={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "";
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14))
    return "а";
  return "ов";
}
