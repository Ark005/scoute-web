"use client";

import { useState, useEffect } from "react";

type Slot = {
  type: string;
  time?: string;
  name?: string;
  id?: number;
  duration_min?: number;
  image_url?: string;
  description?: string;
  is_event?: boolean;
};

type Day = { day?: number; slots?: Slot[]; items?: Slot[] };

type Props = { days: Day[] };

const DAY_COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EAB308"];

function absUrl(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return u;
}

function isCardSlot(s: Slot): boolean {
  if (s.type === "transit") return false;
  return true;
}

function slotIcon(s: Slot): string {
  if (s.is_event) return "🎫";
  if (s.type === "start") return "🚩";
  if (s.type === "breakfast") return "☕";
  if (s.type === "lunch") return "🍽";
  if (s.type === "dinner") return "🌙";
  if (s.type === "hotel") return "🏨";
  return "📍";
}

export default function TripKanban({ days }: Props) {
  const [board, setBoard] = useState<Day[]>(days);
  const [dragged, setDragged] = useState<{ dayIdx: number; slotIdx: number } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  useEffect(() => { setBoard(days); }, [days]);

  const handleDragStart = (dayIdx: number, slotIdx: number) => {
    setDragged({ dayIdx, slotIdx });
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault();
    setDragOverDay(dayIdx);
  };

  const handleDrop = (e: React.DragEvent, targetDayIdx: number) => {
    e.preventDefault();
    setDragOverDay(null);
    if (!dragged) return;
    if (dragged.dayIdx === targetDayIdx) { setDragged(null); return; }

    setBoard(prev => {
      const next = prev.map(d => ({ ...d, slots: [...(d.slots || [])] }));
      const slot = next[dragged.dayIdx].slots![dragged.slotIdx];
      next[dragged.dayIdx].slots!.splice(dragged.slotIdx, 1);
      next[targetDayIdx].slots!.push(slot);
      return next;
    });
    setDragged(null);
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--dark)" }}>
        Доска маршрута
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Перетащите карточки между днями, чтобы изменить порядок.
      </p>
      <div className="overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="flex gap-3" style={{ minWidth: "min-content" }}>
          {board.map((day, dayIdx) => {
            const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
            const cards = (day.slots || []).map((s, i) => ({ slot: s, originalIdx: i })).filter(x => isCardSlot(x.slot));
            const isDragOver = dragOverDay === dayIdx;
            return (
              <div
                key={dayIdx}
                onDragOver={(e) => handleDragOver(e, dayIdx)}
                onDragLeave={() => setDragOverDay(null)}
                onDrop={(e) => handleDrop(e, dayIdx)}
                style={{
                  width: 240,
                  flexShrink: 0,
                  background: isDragOver ? `${color}15` : "#F9FAFB",
                  borderRadius: 14,
                  border: isDragOver ? `2px dashed ${color}` : "1px solid #E5E7EB",
                  padding: 10,
                  transition: "background 0.15s, border 0.15s",
                }}
              >
                <div
                  className="flex items-center gap-2 mb-3 pb-2 border-b"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: color, color: "white" }}
                  >
                    {dayIdx + 1}
                  </div>
                  <div className="font-bold text-sm" style={{ color: "var(--dark)" }}>
                    День {day.day || dayIdx + 1}
                  </div>
                  <div className="ml-auto text-xs text-gray-400">{cards.length}</div>
                </div>

                <div className="flex flex-col gap-2">
                  {cards.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">пусто</div>
                  )}
                  {cards.map(({ slot, originalIdx }) => (
                    <div
                      key={originalIdx}
                      draggable
                      onDragStart={() => handleDragStart(dayIdx, originalIdx)}
                      className="bg-white rounded-lg p-2 cursor-grab active:cursor-grabbing"
                      style={{
                        border: "1px solid #E5E7EB",
                        opacity: dragged?.dayIdx === dayIdx && dragged.slotIdx === originalIdx ? 0.4 : 1,
                      }}
                    >
                      <div className="flex gap-2">
                        {slot.image_url ? (
                          <img
                            src={absUrl(slot.image_url)}
                            alt=""
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 flex-shrink-0 rounded flex items-center justify-center text-xl"
                            style={{ background: `${color}15` }}
                          >
                            {slotIcon(slot)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono font-bold" style={{ color }}>
                            {slot.time || "—"}
                            {slot.duration_min ? <span className="text-gray-400 font-normal"> · {slot.duration_min}м</span> : null}
                          </div>
                          <div className="text-xs font-semibold leading-tight mt-0.5 line-clamp-2" style={{ color: "var(--dark)" }}>
                            {slot.name || "—"}
                          </div>
                          {slot.is_event && (
                            <div className="text-[9px] text-orange-600 font-bold mt-0.5">СОБЫТИЕ</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
