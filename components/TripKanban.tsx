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
  event_date?: string;
  ticket_url?: string;
  latitude?: number;
  longitude?: number;
};

type Day = { day?: number; slots?: Slot[]; items?: Slot[] };

type Props = { days: Day[]; citySlug: string | null };

const DAY_COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EAB308"];

function absUrl(u?: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return u;
}

function slotIcon(s: Slot): string {
  if (s.is_event) return "🎫";
  if (s.type === "start") return "🚩";
  if (s.type === "breakfast") return "☕";
  if (s.type === "lunch") return "🍽";
  if (s.type === "dinner") return "🌙";
  if (s.type === "hotel") return "🏨";
  if (s.type === "restaurant") return "🍴";
  return "📍";
}

function slotLabel(s: Slot): string | null {
  if (s.is_event) return "СОБЫТИЕ";
  if (s.type === "restaurant" || s.type === "lunch" || s.type === "dinner" || s.type === "breakfast") return "РЕСТОРАН";
  if (s.type === "hotel") return "ОТЕЛЬ";
  return null;
}

// ── Picker panel data ─────────────────────────────────────────────────────────

interface PoiItem {
  id: number;
  name: string;
  category?: string;
  rating?: number;
  event_date?: string;
  event_time?: string | null;
  event_type?: string;
  image_url?: string;
  ticket_url?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

const EVENT_BLOCKLIST = [
  /конгресс/i, /конференц/i, /симпозиум/i, /саммит/i, /форум/i, /съезд/i,
  /семинар/i, /тренинг/i, /собрание/i,
  /турнир/i, /чемпионат/i, /лига/i, /кубок/i, /матч/i, /этап/i, /тур\b/i, /раунд/i,
  /лекция/i, /научно/i, /исследовани/i,
  /дерматолог/i, /хирург/i, /стоматолог/i, /медицин/i, /клиник/i,
  /банковск/i, /финанс/i, /инвестиц/i, /пирамид/i,
  /\bии\b/i, /\bai\b/i, /искусственн.*интеллект/i, /модернизац/i,
  /абитуриент/i, /карьер/i, /устойчив.*развит/i,
];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TripKanban({ days, citySlug }: Props) {
  const [board, setBoard] = useState<Day[]>(days);
  const [dragged, setDragged] = useState<{ from: "board" | "panel"; dayIdx?: number; slotIdx?: number; slot?: Slot } | null>(null);
  const [dragOver, setDragOver] = useState<{ dayIdx: number; idx: number } | null>(null);
  const [openPanel, setOpenPanel] = useState<"excursions" | "culture" | "restaurants" | null>(null);

  // Panel data
  const [excursions, setExcursions] = useState<PoiItem[]>([]);
  const [culture, setCulture] = useState<PoiItem[]>([]);
  const [restaurants, setRestaurants] = useState<PoiItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setBoard(days); }, [days]);

  useEffect(() => {
    if (!citySlug) return;
    (async () => {
      try {
        const r = await fetch(`/api/city-pois/?city=${citySlug}`);
        if (!r.ok) return;
        const d = await r.json();
        const attrs: PoiItem[] = d.attractions || [];
        const evts: PoiItem[] = d.events || [];
        const rests: PoiItem[] = d.restaurants || [];
        const today = new Date().toISOString().slice(0, 10);
        const ninetyDaysISO = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

        setExcursions(
          attrs
            .filter(a => ["culture", "history", "architecture", "museums", "parks"].includes(a.category || ""))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        );
        setCulture(
          evts
            .filter(e => e.event_date && e.event_date >= today && e.event_date <= ninetyDaysISO)
            .filter(e => !EVENT_BLOCKLIST.some(rx => rx.test(e.name)))
            .sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""))
        );
        setRestaurants(rests.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
        setLoaded(true);
      } catch { /* silent */ }
    })();
  }, [citySlug]);

  // ── DnD handlers ───────────────────────────────────────────────────────────

  const onCardDragStart = (dayIdx: number, slotIdx: number) => {
    setDragged({ from: "board", dayIdx, slotIdx });
  };

  const onPanelDragStart = (item: PoiItem, source: "excursions" | "culture" | "restaurants") => {
    const slot: Slot = source === "culture" ? {
      type: "attraction",
      time: item.event_time || "19:00",
      name: item.name,
      description: item.event_date ? `Событие · ${new Date(item.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}` : "",
      image_url: item.image_url,
      latitude: item.latitude,
      longitude: item.longitude,
      duration_min: 120,
      is_event: true,
      event_date: item.event_date,
      ticket_url: item.ticket_url,
      id: item.id,
    } : source === "restaurants" ? {
      type: "restaurant",
      time: "13:00",
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      latitude: item.latitude,
      longitude: item.longitude,
      duration_min: 60,
      id: item.id,
    } : {
      type: "attraction",
      time: "10:00",
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      latitude: item.latitude,
      longitude: item.longitude,
      duration_min: 60,
      id: item.id,
    };
    setDragged({ from: "panel", slot });
  };

  const onSlotDragOver = (e: React.DragEvent, dayIdx: number, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver({ dayIdx, idx });
  };

  const onColumnDragOver = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault();
    const dayCards = (board[dayIdx]?.slots || []).filter(s => s.type !== "transit").length;
    setDragOver({ dayIdx, idx: dayCards });
  };

  const onColumnDrop = (e: React.DragEvent, targetDayIdx: number) => {
    e.preventDefault();
    if (!dragged) { setDragOver(null); return; }
    const targetIdx = dragOver?.dayIdx === targetDayIdx ? dragOver.idx : Number.MAX_SAFE_INTEGER;

    setBoard(prev => {
      const next = prev.map(d => ({ ...d, slots: [...(d.slots || [])] }));

      // Build cards-only positional indices to slot positions
      const cardsToReal = (slots: Slot[]) => slots
        .map((s, realIdx) => ({ s, realIdx }))
        .filter(x => x.s.type !== "transit");

      let movedSlot: Slot | null = null;
      if (dragged.from === "board" && dragged.dayIdx !== undefined && dragged.slotIdx !== undefined) {
        movedSlot = next[dragged.dayIdx].slots![dragged.slotIdx];
        next[dragged.dayIdx].slots!.splice(dragged.slotIdx, 1);
      } else if (dragged.from === "panel" && dragged.slot) {
        movedSlot = dragged.slot;
      }
      if (!movedSlot) return prev;

      const targetCards = cardsToReal(next[targetDayIdx].slots || []);
      let insertAt = next[targetDayIdx].slots!.length;
      if (targetIdx < targetCards.length) {
        insertAt = targetCards[targetIdx].realIdx;
      }
      next[targetDayIdx].slots!.splice(insertAt, 0, movedSlot);
      return next;
    });
    setDragged(null);
    setDragOver(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="mb-8">
      <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--dark)" }}>
        Доска маршрута
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Перетаскивайте карточки между днями и внутри дня. Снизу — что ещё можно добавить.
      </p>

      {/* Kanban columns */}
      <div className="overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="flex gap-3" style={{ minWidth: "min-content" }}>
          {board.map((day, dayIdx) => {
            const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
            const cards = (day.slots || []).map((s, i) => ({ slot: s, originalIdx: i })).filter(x => x.slot.type !== "transit");
            return (
              <div
                key={dayIdx}
                onDragOver={(e) => onColumnDragOver(e, dayIdx)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onColumnDrop(e, dayIdx)}
                style={{
                  width: 240,
                  flexShrink: 0,
                  background: "#F9FAFB",
                  borderRadius: 14,
                  border: "1px solid #E5E7EB",
                  padding: 10,
                  minHeight: 200,
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "#E5E7EB" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: color, color: "white" }}>
                    {dayIdx + 1}
                  </div>
                  <div className="font-bold text-sm" style={{ color: "var(--dark)" }}>День {day.day || dayIdx + 1}</div>
                  <div className="ml-auto text-xs text-gray-400">{cards.length}</div>
                </div>

                <div className="flex flex-col gap-2">
                  {cards.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">пусто</div>
                  )}
                  {cards.map(({ slot, originalIdx }, cardIdx) => {
                    const isDragging = dragged?.from === "board" && dragged.dayIdx === dayIdx && dragged.slotIdx === originalIdx;
                    const showDropAbove = dragOver?.dayIdx === dayIdx && dragOver.idx === cardIdx;
                    const label = slotLabel(slot);
                    return (
                      <div key={originalIdx}>
                        {showDropAbove && <div style={{ height: 3, background: color, borderRadius: 2, marginBottom: 6 }} />}
                        <div
                          draggable
                          onDragStart={() => onCardDragStart(dayIdx, originalIdx)}
                          onDragOver={(e) => onSlotDragOver(e, dayIdx, cardIdx)}
                          className="bg-white rounded-lg p-2 cursor-grab active:cursor-grabbing"
                          style={{ border: "1px solid #E5E7EB", opacity: isDragging ? 0.4 : 1 }}
                        >
                          <div className="flex gap-2">
                            {slot.image_url ? (
                              <img src={absUrl(slot.image_url)} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" loading="lazy" />
                            ) : (
                              <div className="w-12 h-12 flex-shrink-0 rounded flex items-center justify-center text-xl" style={{ background: `${color}15` }}>
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
                              {label && (
                                <div className="text-[9px] font-bold mt-0.5" style={{ color: slot.is_event ? "#F97316" : "#6B7280" }}>{label}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* drop zone at end */}
                  {dragOver?.dayIdx === dayIdx && dragOver.idx >= cards.length && (
                    <div style={{ height: 3, background: color, borderRadius: 2 }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Picker panels */}
      <div className="mt-6 flex flex-col gap-2">
        <PanelButton
          label="Экскурсии и музеи"
          emoji="🎫"
          count={excursions.length}
          open={openPanel === "excursions"}
          onClick={() => setOpenPanel(openPanel === "excursions" ? null : "excursions")}
        />
        {openPanel === "excursions" && (
          <PickerRow items={excursions} kind="excursions" onDragStart={(it) => onPanelDragStart(it, "excursions")} loaded={loaded} />
        )}

        <PanelButton
          label="Культурная программа (концерты, театры, выставки)"
          emoji="🎭"
          count={culture.length}
          open={openPanel === "culture"}
          onClick={() => setOpenPanel(openPanel === "culture" ? null : "culture")}
        />
        {openPanel === "culture" && (
          <PickerRow items={culture} kind="culture" onDragStart={(it) => onPanelDragStart(it, "culture")} loaded={loaded} />
        )}

        <PanelButton
          label="Рестораны"
          emoji="🍴"
          count={restaurants.length}
          open={openPanel === "restaurants"}
          onClick={() => setOpenPanel(openPanel === "restaurants" ? null : "restaurants")}
        />
        {openPanel === "restaurants" && (
          <PickerRow items={restaurants} kind="restaurants" onDragStart={(it) => onPanelDragStart(it, "restaurants")} loaded={loaded} />
        )}
      </div>
    </section>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function PanelButton({ label, emoji, count, open, onClick }: { label: string; emoji: string; count: number; open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition"
      style={{ background: open ? "#EFF6FF" : "white", border: `1px solid ${open ? "#3B82F6" : "#E5E7EB"}` }}
    >
      <span className="text-xl">{emoji}</span>
      <span className="font-semibold text-sm flex-1" style={{ color: "var(--dark)" }}>{label}</span>
      <span className="text-xs text-gray-500">{count}</span>
      <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
    </button>
  );
}

function PickerRow({ items, kind, onDragStart, loaded }: {
  items: PoiItem[]; kind: "excursions" | "culture" | "restaurants"; onDragStart: (it: PoiItem) => void; loaded: boolean;
}) {
  if (!loaded) return <div className="text-xs text-gray-400 p-3">загрузка...</div>;
  if (!items.length) return <div className="text-xs text-gray-400 p-3">пока пусто</div>;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: "min-content" }}>
        {items.map(item => (
          <div
            key={`${kind}-${item.id}`}
            draggable
            onDragStart={() => onDragStart(item)}
            className="bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-grab active:cursor-grabbing transition hover:scale-[1.02]"
            style={{ width: 200, border: "1px solid #E5E7EB" }}
          >
            {item.image_url ? (
              <img src={absUrl(item.image_url)} alt="" className="w-full h-24 object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-24 flex items-center justify-center text-3xl bg-gray-100">
                {kind === "culture" ? "🎭" : kind === "restaurants" ? "🍴" : "🎫"}
              </div>
            )}
            <div className="p-2">
              <div className="text-xs font-bold leading-tight line-clamp-2" style={{ color: "var(--dark)" }}>{item.name}</div>
              {kind === "culture" && item.event_date && (
                <div className="text-[10px] text-gray-500 mt-1">
                  {new Date(item.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </div>
              )}
              {kind !== "culture" && item.rating ? (
                <div className="text-[10px] text-gray-500 mt-1">★ {item.rating.toFixed(1)}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
