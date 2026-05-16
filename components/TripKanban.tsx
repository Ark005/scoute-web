"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

type Day = { day?: number; slots?: Slot[]; items?: Slot[]; city_slug?: string };

type Props = { tripId: string; tripTitle: string; days: Day[]; citySlug: string | null; countrySlug: string | null };

const DAY_COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EAB308", "#EC4899", "#06B6D4"];

const CITY_META: Record<string, { label: string; emoji: string }> = {
  tbilisi:    { label: "Тбилиси",   emoji: "🏙" },
  batumi:     { label: "Батуми",    emoji: "🏖" },
  kutaisi:    { label: "Кутаиси",   emoji: "🏛" },
  mtskheta:   { label: "Мцхета",    emoji: "⛪" },
  sighnaghi:  { label: "Сигнахи",   emoji: "🍷" },
  telavi:     { label: "Телави",    emoji: "🍇" },
  borjomi:    { label: "Боржоми",   emoji: "🌲" },
  gudauri:    { label: "Гудаури",   emoji: "⛷️" },
  bakuriani:  { label: "Бакуриани", emoji: "🎿" },
  kazbegi:    { label: "Казбеги",   emoji: "🏔" },
  mestia:     { label: "Местия",    emoji: "🗼" },
  gori:       { label: "Гори",      emoji: "🏰" },
};

const CITY_OPTIONS = Object.entries(CITY_META).map(([slug, m]) => ({ slug, ...m }));
const DAY_CHOICES = [1, 2, 3, 4, 5, 7];

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

// ── Picker panel data types ──────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupDaysByCity(days: Day[], fallback: string | null): { citySlug: string; daysInGroup: { day: Day; globalIdx: number }[] }[] {
  const groups: { citySlug: string; daysInGroup: { day: Day; globalIdx: number }[] }[] = [];
  days.forEach((d, idx) => {
    const slug = d.city_slug || fallback || "tbilisi";
    const last = groups[groups.length - 1];
    if (last && last.citySlug === slug) {
      last.daysInGroup.push({ day: d, globalIdx: idx });
    } else {
      groups.push({ citySlug: slug, daysInGroup: [{ day: d, globalIdx: idx }] });
    }
  });
  return groups;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function TripKanban({ tripId, tripTitle, days, citySlug, countrySlug }: Props) {
  const router = useRouter();
  const [board, setBoard] = useState<Day[]>(days);
  const [dragged, setDragged] = useState<{ from: "board" | "panel"; dayIdx?: number; slotIdx?: number; slot?: Slot } | null>(null);
  const [dragOver, setDragOver] = useState<{ dayIdx: number; idx: number } | null>(null);
  const [openPanel, setOpenPanel] = useState<"excursions" | "culture" | "restaurants" | null>(null);
  const [activeCitySlug, setActiveCitySlug] = useState<string>(citySlug || "tbilisi");
  const [showAddCity, setShowAddCity] = useState(false);
  const [addingCity, setAddingCity] = useState(false);
  const [newCitySlug, setNewCitySlug] = useState<string>("batumi");
  const [newCityDays, setNewCityDays] = useState<number>(3);
  const [addError, setAddError] = useState<string | null>(null);

  // Per-city POI data
  const [poiByCity, setPoiByCity] = useState<Record<string, { excursions: PoiItem[]; culture: PoiItem[]; restaurants: PoiItem[] }>>({});

  useEffect(() => { setBoard(days); }, [days]);

  // Fetch POI for active city when it changes
  useEffect(() => {
    if (!activeCitySlug || poiByCity[activeCitySlug]) return;
    (async () => {
      try {
        const r = await fetch(`/api/city-pois/?city=${activeCitySlug}`);
        if (!r.ok) return;
        const d = await r.json();
        const attrs: PoiItem[] = d.attractions || [];
        const evts: PoiItem[] = d.events || [];
        const rests: PoiItem[] = d.restaurants || [];
        const today = new Date().toISOString().slice(0, 10);
        const ninetyDaysISO = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

        const excursions = attrs
          .filter(a => ["culture", "history", "architecture", "museums", "parks"].includes(a.category || ""))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const culture = evts
          .filter(e => e.event_date && e.event_date >= today && e.event_date <= ninetyDaysISO)
          .filter(e => !EVENT_BLOCKLIST.some(rx => rx.test(e.name)))
          .sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""));
        const restaurants = rests.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setPoiByCity(prev => ({ ...prev, [activeCitySlug]: { excursions, culture, restaurants } }));
      } catch { /* silent */ }
    })();
  }, [activeCitySlug, poiByCity]);

  const cityGroups = groupDaysByCity(board, citySlug);
  const activeCityPois = poiByCity[activeCitySlug] || { excursions: [], culture: [], restaurants: [] };
  const isLoaded = !!poiByCity[activeCitySlug];

  // ── DnD handlers ─────────────────────────────────────────────────────────

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

  // ── Add city ─────────────────────────────────────────────────────────────

  const handleAddCity = async () => {
    setAddingCity(true);
    setAddError(null);
    try {
      const r1 = await fetch("/api/agent/build-from-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_slug: newCitySlug,
          days: newCityDays,
          must_see_names: [],
          fill_with_must_see: true,
          min_count: 5,
        }),
      });
      if (!r1.ok) throw new Error(`build ${r1.status}`);
      const newProgram = await r1.json();
      const newDays: Day[] = (newProgram?.days || []).map((d: Day) => ({ ...d, city_slug: newCitySlug }));

      // Merge with existing board, renumber day index
      const merged = [...board, ...newDays].map((d, i) => ({ ...d, day: i + 1 }));

      // Build merged title
      const slugs = Array.from(new Set(merged.map(d => d.city_slug || citySlug || "").filter(Boolean)));
      const labels = slugs.map(s => CITY_META[s]?.label || s).join(" + ");
      const totalDays = merged.length;
      const title = `${labels} — ${totalDays} ${totalDays === 1 ? "день" : totalDays < 5 ? "дня" : "дн"}`;

      const r2 = await fetch("/api/trip/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          country_slug: countrySlug || "georgia",
          city_slug: citySlug || slugs[0],
          program: { ...newProgram, days: merged },
          meta: { multi_city: slugs },
          source: "kanban_add_city",
        }),
      });
      if (!r2.ok) throw new Error(`save ${r2.status}`);
      const saved = await r2.json();
      router.push(`/trip/${saved.id}`);
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Ошибка");
      setAddingCity(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="mb-8">
      <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--dark)" }}>
        Доска маршрута
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Перетаскивайте карточки между днями и внутри дня. Снизу — что ещё можно добавить.
      </p>

      {/* Kanban — city groups */}
      <div className="overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="flex gap-4 items-start" style={{ minWidth: "min-content" }}>
          {cityGroups.map((group, groupIdx) => {
            const cityMeta = CITY_META[group.citySlug] || { label: group.citySlug, emoji: "📍" };
            const isActive = group.citySlug === activeCitySlug;
            return (
              <div key={groupIdx}>
                {/* City header */}
                <button
                  onClick={() => setActiveCitySlug(group.citySlug)}
                  className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg w-full text-left transition"
                  style={{
                    background: isActive ? "#EFF6FF" : "transparent",
                    border: `1px solid ${isActive ? "#3B82F6" : "#E5E7EB"}`,
                  }}
                >
                  <span className="text-lg">{cityMeta.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: "var(--dark)" }}>{cityMeta.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">{group.daysInGroup.length} {group.daysInGroup.length === 1 ? "день" : group.daysInGroup.length < 5 ? "дня" : "дн"}</span>
                </button>

                {/* Day columns for this city */}
                <div className="flex gap-3">
                  {group.daysInGroup.map(({ day, globalIdx }) => {
                    const color = DAY_COLORS[globalIdx % DAY_COLORS.length];
                    const cards = (day.slots || []).map((s, i) => ({ slot: s, originalIdx: i })).filter(x => x.slot.type !== "transit");
                    return (
                      <div
                        key={globalIdx}
                        onDragOver={(e) => onColumnDragOver(e, globalIdx)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => onColumnDrop(e, globalIdx)}
                        style={{
                          width: 240, flexShrink: 0,
                          background: "#F9FAFB", borderRadius: 14,
                          border: "1px solid #E5E7EB", padding: 10, minHeight: 200,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "#E5E7EB" }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: color, color: "white" }}>
                            {globalIdx + 1}
                          </div>
                          <div className="font-bold text-sm" style={{ color: "var(--dark)" }}>День {globalIdx + 1}</div>
                          <div className="ml-auto text-xs text-gray-400">{cards.length}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {cards.length === 0 && <div className="text-xs text-gray-400 text-center py-4">пусто</div>}
                          {cards.map(({ slot, originalIdx }, cardIdx) => {
                            const isDragging = dragged?.from === "board" && dragged.dayIdx === globalIdx && dragged.slotIdx === originalIdx;
                            const showDropAbove = dragOver?.dayIdx === globalIdx && dragOver.idx === cardIdx;
                            const label = slotLabel(slot);
                            return (
                              <div key={originalIdx}>
                                {showDropAbove && <div style={{ height: 3, background: color, borderRadius: 2, marginBottom: 6 }} />}
                                <div
                                  draggable
                                  onDragStart={() => onCardDragStart(globalIdx, originalIdx)}
                                  onDragOver={(e) => onSlotDragOver(e, globalIdx, cardIdx)}
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
                          {dragOver?.dayIdx === globalIdx && dragOver.idx >= cards.length && (
                            <div style={{ height: 3, background: color, borderRadius: 2 }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Add city button column */}
          <div className="flex flex-col gap-2" style={{ width: 240, flexShrink: 0, marginTop: 44 }}>
            {!showAddCity ? (
              <button
                onClick={() => setShowAddCity(true)}
                className="rounded-xl border-2 border-dashed transition hover:scale-[1.02]"
                style={{
                  borderColor: "#D1D5DB",
                  background: "white",
                  padding: "40px 16px",
                  color: "#6B7280",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                + Добавить город
              </button>
            ) : (
              <div className="rounded-xl bg-white p-3" style={{ border: "1px solid #3B82F6" }}>
                <div className="font-bold text-sm mb-2" style={{ color: "var(--dark)" }}>Какой город?</div>
                <div className="grid grid-cols-2 gap-1 mb-3 max-h-44 overflow-y-auto">
                  {CITY_OPTIONS.map(o => (
                    <button
                      key={o.slug}
                      onClick={() => setNewCitySlug(o.slug)}
                      className="text-left px-2 py-1.5 rounded text-xs transition"
                      style={{
                        background: newCitySlug === o.slug ? "#EFF6FF" : "transparent",
                        border: `1px solid ${newCitySlug === o.slug ? "#3B82F6" : "#E5E7EB"}`,
                        fontWeight: newCitySlug === o.slug ? 700 : 400,
                      }}
                    >
                      {o.emoji} {o.label}
                    </button>
                  ))}
                </div>
                <div className="font-bold text-sm mb-2" style={{ color: "var(--dark)" }}>Сколько дней?</div>
                <div className="flex gap-1 flex-wrap mb-3">
                  {DAY_CHOICES.map(n => (
                    <button
                      key={n}
                      onClick={() => setNewCityDays(n)}
                      className="px-2.5 py-1 rounded text-xs transition"
                      style={{
                        background: newCityDays === n ? "#3B82F6" : "white",
                        color: newCityDays === n ? "white" : "var(--dark)",
                        border: "1px solid #E5E7EB",
                        fontWeight: newCityDays === n ? 700 : 400,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {addError && <div className="text-xs text-red-500 mb-2">{addError}</div>}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCity}
                    disabled={addingCity}
                    className="flex-1 px-3 py-2 rounded-lg text-white text-sm font-bold transition"
                    style={{ background: addingCity ? "#6B7280" : "#1B4DFF", cursor: addingCity ? "default" : "pointer" }}
                  >
                    {addingCity ? "⏳ Собираем..." : "Добавить"}
                  </button>
                  <button
                    onClick={() => { setShowAddCity(false); setAddError(null); }}
                    className="px-3 py-2 rounded-lg text-sm transition"
                    style={{ background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB" }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active city indicator for panels */}
      {Object.keys(CITY_META).includes(activeCitySlug) && cityGroups.length > 1 && (
        <div className="text-xs text-gray-500 mt-3 mb-2">
          Панели снизу показывают {CITY_META[activeCitySlug]?.emoji} {CITY_META[activeCitySlug]?.label}. Кликни заголовок города выше, чтобы переключить.
        </div>
      )}

      {/* Picker panels */}
      <div className="mt-4 flex flex-col gap-2">
        <PanelButton
          label={`Экскурсии и музеи (${CITY_META[activeCitySlug]?.label || activeCitySlug})`}
          emoji="🎫"
          count={activeCityPois.excursions.length}
          open={openPanel === "excursions"}
          onClick={() => setOpenPanel(openPanel === "excursions" ? null : "excursions")}
        />
        {openPanel === "excursions" && (
          <PickerRow items={activeCityPois.excursions} kind="excursions" onDragStart={(it) => onPanelDragStart(it, "excursions")} loaded={isLoaded} />
        )}

        <PanelButton
          label={`Культурная программа — концерты, театры, выставки (${CITY_META[activeCitySlug]?.label || activeCitySlug})`}
          emoji="🎭"
          count={activeCityPois.culture.length}
          open={openPanel === "culture"}
          onClick={() => setOpenPanel(openPanel === "culture" ? null : "culture")}
        />
        {openPanel === "culture" && (
          <PickerRow items={activeCityPois.culture} kind="culture" onDragStart={(it) => onPanelDragStart(it, "culture")} loaded={isLoaded} />
        )}

        <PanelButton
          label={`Рестораны (${CITY_META[activeCitySlug]?.label || activeCitySlug})`}
          emoji="🍴"
          count={activeCityPois.restaurants.length}
          open={openPanel === "restaurants"}
          onClick={() => setOpenPanel(openPanel === "restaurants" ? null : "restaurants")}
        />
        {openPanel === "restaurants" && (
          <PickerRow items={activeCityPois.restaurants} kind="restaurants" onDragStart={(it) => onPanelDragStart(it, "restaurants")} loaded={isLoaded} />
        )}
      </div>
    </section>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

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
