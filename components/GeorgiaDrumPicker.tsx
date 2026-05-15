"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ITEM_H = 44;
const VISIBLE = 3;

interface PoiItem { id: number; name: string; category: string; rating?: number; event_date?: string; event_type?: string; }

// Слова, которые означают «бизнес/наука/спорт» — не для туриста
const EVENT_BLOCKLIST = [
  /конгресс/i, /конференц/i, /симпозиум/i, /саммит/i, /форум/i, /съезд/i,
  /семинар/i, /тренинг/i, /мастер[- ]?класс.*бизнес/i, /собрание/i,
  /турнир/i, /чемпионат/i, /лига/i, /кубок/i, /матч/i, /этап/i, /тур\b/i, /раунд/i,
  /лекция/i, /научно/i, /акадeмическ/i, /исследовани/i,
  /дерматолог/i, /хирург/i, /стоматолог/i, /медицин/i, /клиник/i,
  /банковск/i, /финанс/i, /инвестиц/i, /пирамид/i, /trading/i,
  /\bии\b/i, /\bai\b/i, /искусственн.*интеллект/i, /модернизац/i,
  /абитуриент/i, /карьер/i, /образовани/i, /выпускник/i,
  /устойчив.*развит/i,
];

// ── Drum ──────────────────────────────────────────────────────────────────────

function Drum({ items, selectedIndex, onChange }: { items: string[]; selectedIndex: number; onChange: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const SPACER = (ITEM_H * VISIBLE - ITEM_H) / 2;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = selectedIndex * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset scroll when items change
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [items]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = () => {
      const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), items.length - 1));
      onChange(idx);
    };
    el.addEventListener("scrollend", onEnd);
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => { clearTimeout(t); t = setTimeout(onEnd, 150); };
    el.addEventListener("scroll", onScroll);
    return () => { el.removeEventListener("scrollend", onEnd); el.removeEventListener("scroll", onScroll); };
  }, [items.length, onChange]);

  const scrollTo = (i: number) => ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: SPACER,
        background: "linear-gradient(to bottom,rgba(255,255,255,1),rgba(255,255,255,0))", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: SPACER,
        background: "linear-gradient(to top,rgba(255,255,255,1),rgba(255,255,255,0))", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: 6, right: 6, height: ITEM_H,
        transform: "translateY(-50%)", borderTop: "1px solid rgba(255,107,27,0.45)",
        borderBottom: "1px solid rgba(255,107,27,0.45)", borderRadius: 10, zIndex: 1, pointerEvents: "none" }} />
      <div ref={ref} style={{ height: ITEM_H * VISIBLE, overflowY: "scroll",
        scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div style={{ height: SPACER, scrollSnapAlign: "none", flexShrink: 0 }} />
        {items.map((item, i) => (
          <div key={i} onClick={() => scrollTo(i)} style={{
            height: ITEM_H, scrollSnapAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", userSelect: "none", padding: "0 12px",
            fontSize: i === selectedIndex ? 13 : 11,
            fontWeight: i === selectedIndex ? 700 : 400,
            color: i === selectedIndex ? "#111827" : "#9CA3AF",
            textAlign: "center", lineHeight: 1.3,
            transition: "color 0.1s",
          }}>
            {item}
          </div>
        ))}
        <div style={{ height: SPACER, scrollSnapAlign: "none", flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GeorgiaDrumPicker() {
  const router = useRouter();
  const [excursions, setExcursions] = useState<string[]>(["загрузка..."]);
  const [museums, setMuseums] = useState<string[]>(["загрузка..."]);
  const [events, setEvents] = useState<string[]>(["загрузка..."]);
  const [excIdx, setExcIdx] = useState(0);
  const [musIdx, setMusIdx] = useState(0);
  const [evtIdx, setEvtIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/city-pois/?city=tbilisi");
        if (!res.ok) return;
        const d = await res.json();
        const attrs: PoiItem[] = d.attractions || [];
        const today = new Date().toISOString().slice(0, 10);

        const exc = attrs
          .filter(a => ["culture", "history", "architecture"].includes(a.category))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .map(a => a.name);
        const mus = attrs
          .filter(a => a.category === "museums")
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .map(a => a.name);
        const evtItems: PoiItem[] = d.events || [];
        const upcoming = evtItems
          .filter(e => e.event_date && e.event_date >= today)
          .filter(e => !EVENT_BLOCKLIST.some(rx => rx.test(e.name)))
          .slice(0, 20)
          .map(e => {
            const date = e.event_date
              ? new Date(e.event_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
              : "";
            return date ? `${e.name} · ${date}` : e.name;
          });

        if (exc.length) { setExcursions(exc); setExcIdx(0); }
        if (mus.length) { setMuseums(mus); setMusIdx(0); }
        if (upcoming.length) { setEvents(upcoming); setEvtIdx(0); }
      } catch { /* silent */ }
    }
    load();
  }, []);

  const handleSubmit = async () => {
    const mustSee = [
      excursions[excIdx] !== "загрузка..." ? excursions[excIdx] : null,
      museums[musIdx] !== "загрузка..." ? museums[musIdx] : null,
    ].filter(Boolean).map(s => s!.split(" · ")[0].trim());

    setLoading(true);
    setError(null);
    try {
      const r1 = await fetch("/api/agent/build-from-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_slug: "tbilisi", days: 3, must_see_names: mustSee, fill_with_must_see: true, min_count: 5 }),
      });
      if (!r1.ok) throw new Error(`build ${r1.status}`);
      const program = await r1.json();

      const r2 = await fetch("/api/trip/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Тбилиси — 3 дня",
          country_slug: "georgia",
          city_slug: "tbilisi",
          program,
          meta: {},
          source: "georgia_drums",
        }),
      });
      if (!r2.ok) throw new Error(`save ${r2.status}`);
      const saved = await r2.json();
      router.push(`/trip/${saved.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setLoading(false);
    }
  };

  const drums = [
    { label: "Экскурсии", items: excursions, idx: excIdx, setIdx: setExcIdx },
    { label: "Музеи", items: museums, idx: musIdx, setIdx: setMusIdx },
    { label: "События", items: events, idx: evtIdx, setIdx: setEvtIdx },
  ];

  return (
    <section style={{ background: "white", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", padding: "32px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: -0.5 }}>
            Что добавить в маршрут?
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6, marginBottom: 0 }}>
            Выберите из актуальных экскурсий, музеев и событий Тбилиси
          </p>
        </div>

        {/* Drums */}
        <div style={{ display: "flex", gap: 0, border: "1px solid #F3F4F6", borderRadius: 16, overflow: "hidden", background: "white" }}>
          {drums.map((drum, i) => (
            <>
              <div key={drum.label} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{
                  textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                  letterSpacing: 0.8, textTransform: "uppercase", padding: "10px 0 6px",
                  borderBottom: "1px solid #F9FAFB",
                }}>
                  {drum.label}
                </div>
                <Drum items={drum.items} selectedIndex={drum.idx} onChange={drum.setIdx} />
              </div>
              {i < drums.length - 1 && (
                <div key={`div-${i}`} style={{ width: 1, background: "#F3F4F6", flexShrink: 0 }} />
              )}
            </>
          ))}
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 20, padding: "5px 14px",
          }}>
            <span style={{ fontSize: 16 }}>🎧</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>Аудиогид — бесплатно</span>
          </div>

          {error && <div style={{ color: "#EF4444", fontSize: 12 }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? "#6B7280" : "#1B4DFF",
              color: "white", border: "none", borderRadius: 12,
              padding: "12px 28px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "default" : "pointer", letterSpacing: 0.2,
            }}
          >
            {loading ? "⏳ Составляем..." : "✦ Составить маршрут"}
          </button>
        </div>
      </div>
    </section>
  );
}
