"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CityPOI, CityWeather } from "@/lib/types";

const MAX_DAYS = 7;
const OVERFLOW_THRESHOLD_MIN = 480;

// Day colors (full, for borders/headers)
const DAY_COLORS = ["#3B82F6", "#22C55E", "#F97316", "#A855F7", "#EC4899", "#14B8A6", "#EAB308"];
// Light tints for column backgrounds
const DAY_TINTS = ["#EFF6FF", "#F0FDF4", "#FFF7ED", "#FAF5FF", "#FDF2F8", "#F0FDFA", "#FEFCE8"];

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

function formatMin(m: number): string {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}ч ${r}м` : `${h}ч`;
}

function formatTotalTime(m: number): string {
  if (m === 0) return "";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}м`;
  return r > 0 ? `${h}ч ${r}м` : `${h}ч`;
}

function categoryIcon(cat: string): string {
  const ICONS: Record<string, string> = {
    history: "🏛", museum: "🏛", restaurant: "🍽", cafe: "☕",
    hotels: "🏨", park: "🌳", viewpoint: "🌄", church: "⛪",
    nature: "🌿", gallery: "🎨", theater: "🎭", monument: "🗿",
    restaurants: "🍽", attraction: "🏛", entertainment: "🎉",
    architecture: "🏗", culture: "🎭", religion: "⛪",
  };
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(ICONS)) {
    if (key.includes(k)) return v;
  }
  return "📍";
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

function parseOpeningHour(poi: CityPOI): number | null {
  const oh = poi.opening_hours;
  if (!oh) return null;
  const hoursStr = typeof oh === "string" ? oh : oh.hours;
  if (!hoursStr) return null;
  const m = hoursStr.match(/(\d{1,2})[:.:](\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

function getOpeningHoursStr(poi: CityPOI): string | null {
  const oh = poi.opening_hours;
  if (!oh) return null;
  if (typeof oh === "string") return oh || null;
  return oh.hours ?? null;
}

// ── Distance connector ────────────────────────────────────────────────────────

function DistanceConnector({ from, to, color }: { from: CityPOI; to: CityPOI; color: string }) {
  if (from.latitude == null || from.longitude == null || to.latitude == null || to.longitude == null) {
    return null;
  }
  const km = haversine(from.latitude!, from.longitude!, to.latitude!, to.longitude!);
  const meters = Math.round(km * 1000);
  const walkMin = Math.max(1, Math.round(meters / 83.3));

  return (
    <div className="flex flex-col items-center my-0.5 select-none" aria-hidden>
      <div className="w-px h-2" style={{ background: color + "40" }} />
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{ color, background: color + "10", border: `1px solid ${color}30` }}
      >
        <span>🚶</span>
        <span>{walkMin} мин</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{meters >= 1000 ? `${(meters / 1000).toFixed(1)} км` : `${meters} м`}</span>
      </div>
      <div className="w-px h-2" style={{ background: color + "40" }} />
    </div>
  );
}

// ── Mini POI card inside day ──────────────────────────────────────────────────

function POICardMini({ poi, expanded, dayColor }: { poi: CityPOI; expanded?: boolean; dayColor?: string }) {
  const pastel = categoryPastel(poi.category);
  const hoursStr = getOpeningHoursStr(poi);

  return (
    <div className="flex items-start gap-2">
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
        style={{ background: pastel }}
      >
        {categoryIcon(poi.category)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs leading-tight line-clamp-2" style={{ color: "var(--dark)" }}>{poi.name}</p>
        <div className="flex gap-1.5 mt-0.5 flex-wrap text-[10px]" style={{ color: "var(--grey)" }}>
          {poi.avg_time_min != null && poi.avg_time_min > 0 && <span>⏱ {formatMin(poi.avg_time_min)}</span>}
          {poi.rating && <span>⭐ {poi.rating}</span>}
          {poi.avg_check != null && poi.avg_check > 0 && <span>~{poi.avg_check.toLocaleString("ru")} ₽</span>}
        </div>
        {expanded && (
          <div className="mt-1.5 space-y-0.5">
            {hoursStr && <p className="text-[10px]" style={{ color: "var(--grey)" }}>🕐 {hoursStr}</p>}
            {poi.tip && <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">💡 {poi.tip}</p>}
            {poi.description && <p className="text-[10px] line-clamp-2" style={{ color: "var(--grey)" }}>{poi.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sortable POI card ─────────────────────────────────────────────────────────

function SortablePOICard({ poi, onRemove, dayColor }: {
  poi: CityPOI;
  onRemove?: () => void;
  dayColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: poi.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeft: dayColor ? `3px solid ${dayColor}` : undefined }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5"
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 flex flex-col justify-center gap-0.5 cursor-grab active:cursor-grabbing select-none py-1 px-0.5"
          style={{ color: dayColor ?? "#9ca3af" }}
          title="Перетащить"
        >
          <div className="w-1 h-1 rounded-full bg-current opacity-60" />
          <div className="w-1 h-1 rounded-full bg-current opacity-60" />
          <div className="w-1 h-1 rounded-full bg-current opacity-60" />
          <div className="w-1 h-1 rounded-full bg-current opacity-60" />
          <div className="w-1 h-1 rounded-full bg-current opacity-60" />
          <div className="w-1 h-1 rounded-full bg-current opacity-60" />
        </div>
        <div className="flex-1 min-w-0">
          <POICardMini poi={poi} expanded={expanded} dayColor={dayColor} />
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 text-[10px] leading-none px-1 pt-0.5 rounded transition hover:bg-gray-100"
          style={{ color: "var(--grey)" }}
          title={expanded ? "Свернуть" : "Детали"}
        >
          {expanded ? "▲" : "▼"}
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ── Day column ────────────────────────────────────────────────────────────────

function DayColumn({ dayIndex, pois, onRemove, onDelete, onOptimize, onOverflow, weather, nextDayExists }: {
  dayIndex: number;
  pois: CityPOI[];
  onRemove: (poiId: number) => void;
  onDelete: () => void;
  onOptimize: () => void;
  onOverflow: () => void;
  weather?: CityWeather;
  nextDayExists: boolean;
}) {
  const dotColor = DAY_COLORS[dayIndex % DAY_COLORS.length];
  const tintColor = DAY_TINTS[dayIndex % DAY_TINTS.length];
  const dayLabel = `День ${dayIndex + 1}`;

  const totalMin = pois.reduce((sum, p) => sum + (p.avg_time_min ?? 0), 0);
  const isOverflow = totalMin > OVERFLOW_THRESHOLD_MIN;

  function weatherEmoji(w: CityWeather): string {
    if (w.icon && !w.icon.startsWith("undefined")) return w.icon;
    const d = (w.description ?? "").toLowerCase();
    if (d.includes("rain") || d.includes("дождь")) return "🌧";
    if (d.includes("cloud") || d.includes("облач")) return "☁️";
    if (d.includes("snow") || d.includes("снег")) return "❄️";
    if (d.includes("thunder") || d.includes("гроза")) return "⛈";
    if (d.includes("fog") || d.includes("туман")) return "🌫";
    return "🌤";
  }
  const weatherLabel = weather && weather.temp != null && !isNaN(weather.temp) ? `${weatherEmoji(weather)} ${Math.round(weather.temp)}°` : "";

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: `2px solid ${isOverflow ? "#fca5a5" : dotColor}`,
        minHeight: 200,
      }}
    >
      {/* Column header — colored */}
      <div
        className="px-3 py-2.5 flex items-center justify-between flex-shrink-0"
        style={{ background: isOverflow ? "#fef2f2" : tintColor, borderBottom: `1px solid ${dotColor}30` }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dotColor }} />
          <p className="font-bold text-sm" style={{ color: dotColor }}>{dayLabel}</p>
          <span className="text-xs" style={{ color: "var(--grey)" }}>{weatherLabel}</span>

          {totalMin > 0 && (
            <span className="text-[10px] font-semibold" style={{ color: isOverflow ? "#ef4444" : dotColor }}>
              · ⏱ {formatTotalTime(totalMin)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOptimize}
            title="Оптимизировать порядок"
            className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition hover:opacity-80"
            style={{ background: dotColor + "20", color: dotColor, border: `1px solid ${dotColor}40` }}
          >
            ⚡
          </button>
          {isOverflow && (
            <button
              onClick={onOverflow}
              title="Перенести лишнее на следующий день"
              className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition hover:opacity-80"
              style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5" }}
            >
              ↓
            </button>
          )}
          <button onClick={onDelete} className="text-gray-400 hover:text-gray-600 transition text-sm leading-none px-1" title="Удалить день">×</button>
        </div>
      </div>

      {/* Drop zone */}
      <SortableContext items={pois.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2.5 flex flex-col gap-0" style={{ background: tintColor + "80" }}>
          {pois.length === 0 && (
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed min-h-[80px]"
              style={{ borderColor: dotColor + "50" }}
            >
              <span className="text-xl mb-1" style={{ color: dotColor }}>+</span>
              <p className="text-xs font-medium" style={{ color: dotColor + "aa" }}>Перетащи сюда</p>
            </div>
          )}
          {pois.map((poi, idx) => (
            <div key={poi.id}>
              {idx > 0 && <DistanceConnector from={pois[idx - 1]} to={poi} color={dotColor} />}
              <SortablePOICard poi={poi} onRemove={() => onRemove(poi.id)} dayColor={dotColor} />
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  pois: CityPOI[];
  onRemove?: (id: number) => void;
  onAutoFill?: () => void;
  weather?: CityWeather;
}

type Assignment = Record<number, number | null>;

export default function CityDayPlanner({ pois, onRemove, onAutoFill, weather }: Props) {
  const [numDays, setNumDays] = useState(3);
  const [assignment, setAssignment] = useState<Assignment>(() => {
    const init: Assignment = {};
    for (const p of pois) init[p.id] = null;
    return init;
  });
  const [bucketOrder, setBucketOrder] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = { unassigned: pois.map(p => p.id) };
    for (let i = 0; i < MAX_DAYS; i++) init[String(i)] = [];
    return init;
  });
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const pendingDistribute = useRef(false);

  // Sync new POIs from prop into unassigned bucket
  useEffect(() => {
    const allKnownIds = new Set<number>();
    setAssignment(prev => {
      const next = { ...prev };
      let changed = false;
      for (const p of pois) {
        allKnownIds.add(p.id);
        if (!(p.id in next)) {
          next[p.id] = null;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setBucketOrder(prev => {
      const assignedIds = new Set<number>();
      for (const [key, ids] of Object.entries(prev)) {
        if (key !== "unassigned") for (const id of ids) assignedIds.add(id);
      }
      const unassigned = [...prev.unassigned];
      let changed = false;
      for (const p of pois) {
        if (!assignedIds.has(p.id) && !unassigned.includes(p.id)) {
          unassigned.push(p.id);
          changed = true;
        }
      }
      const allIds = new Set(pois.map(p => p.id));
      const filtered = unassigned.filter(id => allIds.has(id));
      if (filtered.length !== unassigned.length) changed = true;
      if (!changed) return prev;
      return { ...prev, unassigned: filtered };
    });
  }, [pois]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function bucketOf(id: UniqueIdentifier): string {
    const poiId = Number(id);
    const day = assignment[poiId];
    return day === null || day === undefined ? "unassigned" : String(day);
  }

  const activePoi = activeId ? pois.find(p => p.id === Number(activeId)) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const fromBucket = bucketOf(active.id);
    const toBucket = bucketOf(over.id);
    if (fromBucket === toBucket) return;

    setBucketOrder(prev => {
      const fromList = prev[fromBucket].filter(id => id !== Number(active.id));
      const toList = [...(prev[toBucket] ?? [])];
      const overIndex = toList.indexOf(Number(over.id));
      if (overIndex >= 0) toList.splice(overIndex, 0, Number(active.id));
      else toList.push(Number(active.id));
      return { ...prev, [fromBucket]: fromList, [toBucket]: toList };
    });

    setAssignment(prev => ({
      ...prev,
      [Number(active.id)]: toBucket === "unassigned" ? null : Number(toBucket),
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const bucket = bucketOf(active.id);
    const overBucket = bucketOf(over.id);
    if (bucket !== overBucket) return;

    setBucketOrder(prev => {
      const list = prev[bucket] ?? [];
      const oldIdx = list.indexOf(Number(active.id));
      const newIdx = list.indexOf(Number(over.id));
      if (oldIdx < 0 || newIdx < 0) return prev;
      return { ...prev, [bucket]: arrayMove(list, oldIdx, newIdx) };
    });
  }

  const removeFromDay = useCallback((poiId: number) => {
    const day = assignment[poiId];
    if (day === null || day === undefined) { onRemove?.(poiId); return; }
    const bucket = String(day);
    setAssignment(prev => ({ ...prev, [poiId]: null }));
    setBucketOrder(prev => ({
      ...prev,
      [bucket]: prev[bucket].filter(id => id !== poiId),
      unassigned: [...prev.unassigned, poiId],
    }));
  }, [assignment, onRemove]);

  const deleteDay = useCallback((dayIndex: number) => {
    const bucket = String(dayIndex);
    const dayPois = bucketOrder[bucket] ?? [];
    setAssignment(prev => { const next = { ...prev }; for (const id of dayPois) next[id] = null; return next; });
    setBucketOrder(prev => ({ ...prev, [bucket]: [], unassigned: [...prev.unassigned, ...dayPois] }));
    setNumDays(n => Math.max(1, n - 1));
  }, [bucketOrder]);

  const addDay = useCallback(() => setNumDays(n => Math.min(MAX_DAYS, n + 1)), []);

  const distributeAcrossDays = useCallback(() => {
    const unassignedIds = [...bucketOrder.unassigned];
    if (unassignedIds.length === 0) return;
    const sorted = [...unassignedIds].sort((a, b) => {
      const pa = pois.find(p => p.id === a);
      const pb = pois.find(p => p.id === b);
      if (!pa || !pb) return 0;
      if (pa.must_see && !pb.must_see) return -1;
      if (!pa.must_see && pb.must_see) return 1;
      return (pb.rating ?? 0) - (pa.rating ?? 0);
    });
    // Ensure enough days
    const needed = Math.max(numDays, Math.ceil(sorted.length / 6));
    const days = Math.min(needed, MAX_DAYS);
    setNumDays(days);
    // Distribute round-robin
    const newDayBuckets: Record<string, number[]> = {};
    for (let i = 0; i < MAX_DAYS; i++) newDayBuckets[String(i)] = [...(bucketOrder[String(i)] ?? [])];
    const newAssignment: Assignment = { ...assignment };
    sorted.forEach((id, idx) => {
      const dayIdx = idx % days;
      newDayBuckets[String(dayIdx)].push(id);
      newAssignment[id] = dayIdx;
    });
    setBucketOrder(prev => ({ ...prev, ...newDayBuckets, unassigned: [] }));
    setAssignment(newAssignment);
  }, [bucketOrder, pois, numDays, assignment]);

  const optimizeDay = useCallback((dayIndex: number) => {
    const bucket = String(dayIndex);
    const dayPoiIds = bucketOrder[bucket] ?? [];
    const dayPois = dayPoiIds.map(id => pois.find(p => p.id === id)).filter(Boolean) as CityPOI[];
    const sorted = [...dayPois].sort((a, b) => {
      const aH = parseOpeningHour(a);
      const bH = parseOpeningHour(b);
      if (aH !== null && bH !== null) return aH - bH;
      if (aH !== null) return -1;
      if (bH !== null) return 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
    setBucketOrder(prev => ({ ...prev, [bucket]: sorted.map(p => p.id) }));
  }, [bucketOrder, pois]);

  const overflowDay = useCallback((dayIndex: number) => {
    const bucket = String(dayIndex);
    const dayPoiIds = [...(bucketOrder[bucket] ?? [])];
    const dayPoiList = dayPoiIds.map(id => pois.find(p => p.id === id)).filter(Boolean) as CityPOI[];
    let runningMin = 0;
    let splitIdx = dayPoiList.length;
    for (let i = 0; i < dayPoiList.length; i++) {
      runningMin += dayPoiList[i].avg_time_min ?? 0;
      if (runningMin > OVERFLOW_THRESHOLD_MIN) { splitIdx = i; break; }
    }
    if (splitIdx >= dayPoiList.length) return;
    const keepIds = dayPoiIds.slice(0, splitIdx);
    const moveIds = dayPoiIds.slice(splitIdx);
    const targetDayIndex = dayIndex + 1;
    if (targetDayIndex >= numDays && numDays < MAX_DAYS) setNumDays(n => Math.min(MAX_DAYS, n + 1));
    const targetBucket = String(targetDayIndex);
    setAssignment(prev => { const next = { ...prev }; for (const id of moveIds) next[id] = targetDayIndex; return next; });
    setBucketOrder(prev => ({ ...prev, [bucket]: keepIds, [targetBucket]: [...moveIds, ...(prev[targetBucket] ?? [])] }));
  }, [bucketOrder, pois, numDays]);

  // Keep a fresh ref to distributeAcrossDays to avoid stale closure in effect
  const distributeRef = useRef(distributeAcrossDays);
  distributeRef.current = distributeAcrossDays;

  // When auto-fill was requested and pois arrive, trigger distribution
  useEffect(() => {
    if (pendingDistribute.current && bucketOrder.unassigned.length > 0) {
      pendingDistribute.current = false;
      distributeRef.current();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketOrder.unassigned.length]);

  function poisForBucket(bucket: string): CityPOI[] {
    return (bucketOrder[bucket] ?? []).map(id => pois.find(p => p.id === id)).filter(Boolean) as CityPOI[];
  }

  const unassignedPois = poisForBucket("unassigned");
  const dayIndices = Array.from({ length: numDays }, (_, i) => i);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-extrabold text-sm flex items-center gap-1.5" style={{ color: "var(--dark)" }}>
          📋 Маршрут
        </p>
        <div className="flex items-center gap-2">
          {numDays < MAX_DAYS && (
            <button onClick={addDay} className="px-3 py-1 rounded-lg text-xs font-bold border transition hover:bg-gray-50" style={{ borderColor: "#e5e7eb", color: "var(--dark)" }}>
              + День
            </button>
          )}
          <button
            onClick={() => {
              if (bucketOrder.unassigned.length > 0) {
                distributeAcrossDays();
              } else {
                pendingDistribute.current = true;
                onAutoFill?.();
              }
            }}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--orange)" }}
          >
            ✨ Автозаполнение
          </button>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(numDays, 3)}, 1fr)` }}>
        {dayIndices.map(dayIndex => (
          <DayColumn
            key={`day-${dayIndex}`}
            dayIndex={dayIndex}
            pois={poisForBucket(String(dayIndex))}
            onRemove={removeFromDay}
            onDelete={() => deleteDay(dayIndex)}
            onOptimize={() => optimizeDay(dayIndex)}
            onOverflow={() => overflowDay(dayIndex)}
            weather={weather}
            nextDayExists={dayIndex + 1 < numDays}
          />
        ))}
      </div>

      {/* Unassigned */}
      {unassignedPois.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--grey)" }}>
            Не распределено — {unassignedPois.length}
          </p>
          <SortableContext items={unassignedPois.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {unassignedPois.map(poi => (
                <SortablePOICard key={poi.id} poi={poi} onRemove={() => removeFromDay(poi.id)} />
              ))}
            </div>
          </SortableContext>
        </div>
      )}

      {/* Drag overlay */}
      <DragOverlay>
        {activePoi && (
          <div className="bg-white rounded-xl border border-blue-300 shadow-xl p-2.5 w-56 opacity-95">
            <POICardMini poi={activePoi} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
