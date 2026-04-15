"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RouteDetail, Waypoint } from "@/lib/types";

const TYPE_ICONS: Record<string, string> = {
  attraction: "🏛", restaurant: "🍽", hotel: "🏨",
  parking: "🅿️", gas: "⛽", viewpoint: "🌄", border: "🛂",
};
const TYPE_LABELS: Record<string, string> = {
  attraction: "Достопримечательность", restaurant: "Ресторан",
  hotel: "Отель", parking: "Парковка", gas: "Заправка",
  viewpoint: "Смотровая", border: "КПП",
};

const PlannerMap = dynamic(() => import("./PlannerMap"), { ssr: false });

function nearestNeighborTSP(wps: Waypoint[]): Waypoint[] {
  if (wps.length <= 2) return wps;
  const remaining = [...wps];
  const result: Waypoint[] = [remaining.splice(0, 1)[0]];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0, bestDist = Infinity;
    remaining.forEach((w, i) => {
      const d = Math.hypot(w.latitude - last.latitude, w.longitude - last.longitude);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
}

interface Props { route: RouteDetail; }

export default function PlannerView({ route }: Props) {
  const waypoints = route.waypoints ?? route.waypoints_preview ?? [];
  const [order, setOrder] = useState<Waypoint[]>(waypoints);
  const [excluded, setExcluded] = useState<Waypoint[]>([]);
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIdx = prev.findIndex((w) => w.id === active.id);
      const newIdx = prev.findIndex((w) => w.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  const exclude = useCallback((wp: Waypoint) => {
    setOrder((prev) => prev.filter((w) => w.id !== wp.id));
    setExcluded((prev) => [...prev, wp]);
  }, []);

  const include = useCallback((wp: Waypoint) => {
    setExcluded((prev) => prev.filter((w) => w.id !== wp.id));
    setOrder((prev) => [...prev, wp]);
  }, []);

  const optimize = useCallback(() => {
    setOrder((prev) => nearestNeighborTSP(prev));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div style={{ background: "var(--dark)" }} className="px-5 pt-10 pb-4">
        <Link href={`/routes/${route.slug}`} className="inline-flex items-center gap-1 text-white/60 text-sm mb-2 hover:text-white transition">
          ← {route.title}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-extrabold">Планировщик</h1>
          {order.length >= 3 && (
            <button onClick={optimize} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/20 transition">
              ⚡ Оптимизировать
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="h-56 lg:h-auto lg:flex-1 lg:order-2 relative">
          <PlannerMap waypoints={order} hoveredStop={hoveredStop} />
        </div>

        <div className="lg:w-96 lg:order-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
          <div className="p-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={order.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {order.map((wp, idx) => (
                    <SortableWaypointCard
                      key={wp.id}
                      wp={wp}
                      index={idx + 1}
                      isHovered={hoveredStop === wp.id}
                      onHover={setHoveredStop}
                      onExclude={exclude}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {excluded.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--grey)" }}>
                  Подвал — убранные места
                </p>
                <div className="space-y-2">
                  {excluded.map((wp) => (
                    <div key={wp.id} className="bg-white/60 rounded-xl p-3 border border-dashed border-gray-300 flex items-center gap-3 cursor-pointer hover:bg-white transition" onClick={() => include(wp)}>
                      <span>➕</span>
                      <div>
                        <p className="text-sm font-medium text-gray-500 line-through">{wp.name}</p>
                        <p className="text-xs text-gray-400">Нажми чтобы вернуть</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableWaypointCard({ wp, index, isHovered, onHover, onExclude }: {
  wp: Waypoint; index: number; isHovered: boolean;
  onHover: (id: number | null) => void; onExclude: (w: Waypoint) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wp.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [expanded, setExpanded] = useState(false);

  const isRestaurant = wp.waypoint_type === "restaurant";
  const isHotel = wp.waypoint_type === "hotel";

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl border transition ${
        wp.is_closed ? "border-red-200 bg-red-50/30" :
        isHovered ? "border-blue-400 shadow-md" : "border-gray-100 shadow-sm"
      }`}
      onMouseEnter={() => onHover(wp.id)} onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none text-lg">⠿</div>

        {/* Number */}
        <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5" style={{ background: wp.is_closed ? "#ef4444" : "var(--blue)" }}>{index}</div>

        {/* Thumbnail */}
        {wp.image_url && (
          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden relative mt-0.5">
            <Image src={wp.image_url} alt={wp.name} fill className="object-cover" sizes="48px" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {/* Type label */}
          <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--grey)" }}>
            {TYPE_ICONS[wp.waypoint_type] || "📍"} {TYPE_LABELS[wp.waypoint_type] || wp.waypoint_type}
          </p>

          {/* Name */}
          <p className={`font-bold text-sm leading-tight ${expanded ? "" : "line-clamp-2"}`} style={{ color: "var(--dark)" }}>
            {wp.name}
            {wp.is_closed && <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">ЗАКРЫТ</span>}
          </p>

          {/* Meta row */}
          <div className="flex gap-2 mt-1 text-[11px] flex-wrap" style={{ color: "var(--grey)" }}>
            {wp.duration_min > 0 && <span>⏱ {formatMin(wp.duration_min)}</span>}
            {wp.opening_hours && <span>🕐 {wp.opening_hours}</span>}
            {wp.entrance_fee != null && wp.entrance_fee > 0 && <span>🎫 {wp.entrance_fee} ₽</span>}
            {wp.entrance_fee === 0 && <span>🎫 Бесплатно</span>}
            {isRestaurant && wp.avg_check && <span>💰 ~{wp.avg_check} ₽</span>}
            {isHotel && wp.hotel_price_from && <span>💰 от {wp.hotel_price_from} ₽</span>}
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-2 space-y-1">
              {wp.is_closed && wp.closed_reason && (
                <p className="text-xs text-red-600">🚫 {wp.closed_reason}</p>
              )}
              {wp.description && (
                <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "var(--grey)" }}>
                  {wp.description}
                </p>
              )}
              {wp.tip && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">💡 {wp.tip}</p>
              )}
              {isRestaurant && wp.menu_url && (
                <a href={wp.menu_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium text-orange-600 hover:underline">Меню →</a>
              )}
              {isHotel && wp.hotel_url && (
                <a href={wp.hotel_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:underline">Забронировать →</a>
              )}
              {wp.phone && <p className="text-xs" style={{ color: "var(--grey)" }}>📞 {wp.phone}</p>}
              {wp.website_url && (
                <a href={wp.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:underline">Сайт →</a>
              )}

              {/* Highlights */}
              {wp.highlights && wp.highlights.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--grey)" }}>Что посмотреть</p>
                  {wp.highlights.map((h, i) => (
                    <p key={i} className="text-xs" style={{ color: "var(--grey)" }}>
                      {h.icon || "•"} {h.name}
                      {h.duration_min ? ` · ${h.duration_min} мин` : ""}
                      {h.price_rub ? ` · ${h.price_rub} ₽` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand indicator + remove */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <button onClick={() => onExclude(wp)} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition">×</button>
          <span className="text-[10px] text-gray-300">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
    </div>
  );
}

function formatMin(m: number): string {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}ч ${r}м` : `${h}ч`;
}
