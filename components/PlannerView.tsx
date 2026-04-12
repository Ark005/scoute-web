"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RouteDetail, Stop } from "@/lib/types";

const PlannerMap = dynamic(() => import("./PlannerMap"), { ssr: false });

interface Props {
  route: RouteDetail;
}

type Plan = Record<number, Stop[]>;

function buildInitialPlan(stops: Stop[]): Plan {
  const plan: Plan = {};
  stops.forEach((s) => {
    if (!plan[s.day]) plan[s.day] = [];
    plan[s.day].push(s);
  });
  Object.keys(plan).forEach((d) => {
    plan[Number(d)].sort((a, b) => a.order - b.order);
  });
  return plan;
}

function nearestNeighborTSP(stops: Stop[]): Stop[] {
  if (stops.length <= 2) return stops;
  const remaining = [...stops];
  const result: Stop[] = [remaining.splice(0, 1)[0]];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = Math.hypot(s.lat - last.lat, s.lng - last.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
}

export default function PlannerView({ route }: Props) {
  const days = Array.from(new Set(route.stops.map((s) => s.day))).sort(
    (a, b) => a - b
  );

  const [plan, setPlan] = useState<Plan>(() => buildInitialPlan(route.stops));
  const [excluded, setExcluded] = useState<Stop[]>([]);
  const [activeDay, setActiveDay] = useState(days[0] ?? 1);
  const [hoveredStop, setHoveredStop] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPlan((prev) => {
      const dayStops = [...(prev[activeDay] ?? [])];
      const oldIdx = dayStops.findIndex((s) => s.id === active.id);
      const newIdx = dayStops.findIndex((s) => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return { ...prev, [activeDay]: arrayMove(dayStops, oldIdx, newIdx) };
    });
  }

  const exclude = useCallback(
    (stop: Stop) => {
      setPlan((prev) => ({
        ...prev,
        [activeDay]: (prev[activeDay] ?? []).filter((s) => s.id !== stop.id),
      }));
      setExcluded((prev) => [...prev, stop]);
    },
    [activeDay]
  );

  const include = useCallback(
    (stop: Stop) => {
      setExcluded((prev) => prev.filter((s) => s.id !== stop.id));
      setPlan((prev) => ({
        ...prev,
        [activeDay]: [...(prev[activeDay] ?? []), stop],
      }));
    },
    [activeDay]
  );

  const moveToDay = useCallback((stop: Stop, fromDay: number, toDay: number) => {
    setPlan((prev) => ({
      ...prev,
      [fromDay]: (prev[fromDay] ?? []).filter((s) => s.id !== stop.id),
      [toDay]: [...(prev[toDay] ?? []), stop],
    }));
  }, []);

  const optimize = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      [activeDay]: nearestNeighborTSP(prev[activeDay] ?? []),
    }));
  }, [activeDay]);

  const dayStops = plan[activeDay] ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--dark)" }} className="px-5 pt-10 pb-4">
        <Link
          href={`/routes/${route.slug}`}
          className="inline-flex items-center gap-1 text-white/60 text-sm mb-2 hover:text-white transition"
        >
          ← {route.title}
        </Link>
        <h1 className="text-white text-lg font-extrabold">Планировщик</h1>
      </div>

      {/* Day tabs */}
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none items-center"
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
            День {d} ({(plan[d] ?? []).length})
          </button>
        ))}
        {dayStops.length >= 3 && (
          <button
            onClick={optimize}
            className="shrink-0 ml-auto px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/20 transition"
          >
            ⚡ Оптимизировать
          </button>
        )}
      </div>

      {/* Map + List */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div className="h-56 lg:h-auto lg:flex-1 lg:order-2 relative">
          <PlannerMap stops={dayStops} hoveredStop={hoveredStop} />
        </div>

        {/* List */}
        <div className="lg:w-96 lg:order-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <div className="p-4">
            {/* Day stops with drag&drop */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={dayStops.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {dayStops.map((stop, idx) => (
                    <SortableStopCard
                      key={stop.id}
                      stop={stop}
                      index={idx + 1}
                      days={days}
                      activeDay={activeDay}
                      isHovered={hoveredStop === stop.id}
                      onHover={setHoveredStop}
                      onExclude={exclude}
                      onMoveToDay={moveToDay}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {dayStops.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Нет мест на этот день
              </div>
            )}

            {/* Excluded / basement */}
            {excluded.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--grey)" }}>
                  Подвал — убранные места
                </p>
                <div className="space-y-2">
                  {excluded.map((stop) => (
                    <div
                      key={stop.id}
                      className="bg-white/60 rounded-xl p-3 border border-dashed border-gray-300 flex items-center gap-3 cursor-pointer hover:bg-white transition"
                      onClick={() => include(stop)}
                    >
                      <span className="text-lg">➕</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 line-through">{stop.name}</p>
                        <p className="text-xs text-gray-400">Нажми чтобы добавить в День {activeDay}</p>
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

function SortableStopCard({
  stop,
  index,
  days,
  activeDay,
  isHovered,
  onHover,
  onExclude,
  onMoveToDay,
}: {
  stop: Stop;
  index: number;
  days: number[];
  activeDay: number;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  onExclude: (s: Stop) => void;
  onMoveToDay: (s: Stop, from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const otherDays = days.filter((d) => d !== activeDay);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border transition ${
        isHovered ? "border-blue-400 shadow-md" : "border-gray-100 shadow-sm"
      }`}
      onMouseEnter={() => onHover(stop.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none"
        >
          ⠿
        </div>

        {/* Number */}
        <div
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
          style={{ background: "var(--blue)" }}
        >
          {index}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--dark)" }}>
            {stop.name}
          </p>
          {stop.category && (
            <p className="text-xs mt-0.5" style={{ color: "var(--grey)" }}>
              {stop.category}
            </p>
          )}
          {(stop.duration_minutes || stop.price_rub) && (
            <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--grey)" }}>
              {stop.duration_minutes && <span>⏱ {stop.duration_minutes} мин</span>}
              {stop.price_rub && <span>💳 от {stop.price_rub} ₽</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {otherDays.map((d) => (
            <button
              key={d}
              onClick={() => onMoveToDay(stop, activeDay, d)}
              className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-medium"
              title={`Перенести в день ${d}`}
            >
              → Д{d}
            </button>
          ))}
          <button
            onClick={() => onExclude(stop)}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition"
            title="Убрать в подвал"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
