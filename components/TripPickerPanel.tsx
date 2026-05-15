"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Data ──────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { flag: "🇬🇪", name: "Грузия",        slug: "georgia" },
  { flag: "🇷🇺", name: "Россия",         slug: "russia" },
  { flag: "🇹🇷", name: "Турция",         slug: "turkey" },
  { flag: "🇦🇲", name: "Армения",        slug: "armenia" },
  { flag: "🇦🇿", name: "Азербайджан",    slug: "azerbaijan" },
  { flag: "🇺🇿", name: "Узбекистан",     slug: "uzbekistan" },
  { flag: "🇰🇿", name: "Казахстан",      slug: "kazakhstan" },
  { flag: "🇰🇬", name: "Кыргызстан",     slug: "kyrgyzstan" },
  { flag: "🇮🇱", name: "Израиль",        slug: "israel" },
  { flag: "🇦🇪", name: "ОАЭ",           slug: "uae" },
  { flag: "🇫🇷", name: "Франция",        slug: "france" },
  { flag: "🇮🇹", name: "Италия",         slug: "italy" },
  { flag: "🇩🇪", name: "Германия",       slug: "germany" },
  { flag: "🇪🇸", name: "Испания",        slug: "spain" },
  { flag: "🇦🇹", name: "Австрия",        slug: "austria" },
  { flag: "🇬🇷", name: "Греция",         slug: "greece" },
  { flag: "🇯🇵", name: "Япония",         slug: "japan" },
  { flag: "🇹🇭", name: "Таиланд",        slug: "thailand" },
  { flag: "🇮🇳", name: "Индия",          slug: "india" },
];

const DAYS = [3, 5, 7, 10, 14, 21];

const TRIP_TYPES = [
  { emoji: "🏖", label: "Пляж" },
  { emoji: "🚗", label: "Автотур" },
  { emoji: "🎭", label: "Экскурсии" },
  { emoji: "⛷️", label: "Горнолыжка" },
  { emoji: "🥾", label: "Трекинг" },
  { emoji: "🏙", label: "Городской" },
  { emoji: "⚡", label: "Активный" },
];

const BUDGETS = [
  { emoji: "💸", label: "Эконом" },
  { emoji: "💰", label: "Средний" },
  { emoji: "💎", label: "Комфорт" },
  { emoji: "👑", label: "Премиум" },
];

const ITEM_H = 40;
const VISIBLE = 3;

// ── Drum picker ───────────────────────────────────────────────────────────────

function Drum({
  items,
  selectedIndex,
  onChange,
  flex = 1,
}: {
  items: string[];
  selectedIndex: number;
  onChange: (i: number) => void;
  flex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timer = useRef<any>(null);
  const inner = selectedIndex;

  // Init scroll position
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = inner * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const raw = ref.current.scrollTop / ITEM_H;
      const idx = Math.round(raw);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      ref.current.scrollTop = clamped * ITEM_H;
      onChange(clamped);
    }, 80);
  }, [items.length, onChange]);

  return (
    <div
      style={{
        flex,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top + bottom fade */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H,
        background: "linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)",
        zIndex: 2, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H,
        background: "linear-gradient(to top, rgba(255,255,255,0.95), transparent)",
        zIndex: 2, pointerEvents: "none",
      }} />

      {/* Selection lane */}
      <div style={{
        position: "absolute",
        top: "50%", left: 4, right: 4,
        height: ITEM_H,
        transform: "translateY(-50%)",
        borderTop: "1px solid rgba(255,107,27,0.4)",
        borderBottom: "1px solid rgba(255,107,27,0.4)",
        borderRadius: 8,
        zIndex: 1, pointerEvents: "none",
      }} />

      {/* Scroll area */}
      <div
        ref={ref}
        onScroll={onScroll}
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: "scroll",
          scrollbarWidth: "none",
          paddingTop: ITEM_H,
          paddingBottom: ITEM_H,
          boxSizing: "content-box",
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => {
              if (ref.current) ref.current.scrollTop = i * ITEM_H;
              onChange(i);
            }}
            style={{
              height: ITEM_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              transition: "color 0.12s, font-size 0.12s",
              fontSize: i === selectedIndex ? 13 : 11,
              fontWeight: i === selectedIndex ? 700 : 400,
              color: i === selectedIndex ? "#111827" : "#9CA3AF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              padding: "0 8px",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini calendar ─────────────────────────────────────────────────────────────

const MONTH_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DOW_RU = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function buildMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-first: 0=Mon..6=Sun
  let startDow = firstDay.getDay(); // 0=Sun..6=Sat
  startDow = startDow === 0 ? 6 : startDow - 1;
  const days: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function MonthGrid({
  year, month, startDate, endDate, onDayClick,
}: {
  year: number; month: number;
  startDate: Date | null; endDate: Date | null;
  onDayClick: (d: Date) => void;
}) {
  const days = buildMonth(year, month);
  const isStart = (d: number) => startDate?.getFullYear() === year && startDate?.getMonth() === month && startDate?.getDate() === d;
  const isEnd = (d: number) => endDate?.getFullYear() === year && endDate?.getMonth() === month && endDate?.getDate() === d;
  const inRange = (d: number) => {
    if (!startDate || !endDate) return false;
    const dt = new Date(year, month, d);
    return dt > startDate && dt < endDate;
  };
  const isToday = (d: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
  };
  const isPast = (d: number) => {
    const now = new Date(); now.setHours(0,0,0,0);
    return new Date(year, month, d) < now;
  };

  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 12, color: "#111827", marginBottom: 6 }}>
        {MONTH_RU[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {DOW_RU.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#9CA3AF", fontWeight: 600, paddingBottom: 4 }}>{d}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const start = isStart(d), end = isEnd(d), range = inRange(d), today = isToday(d), past = isPast(d);
          return (
            <div
              key={i}
              onClick={() => !past && onDayClick(new Date(year, month, d))}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: start || end ? 700 : 400,
                color: start || end ? "white" : range ? "#1B4DFF" : past ? "#D1D5DB" : today ? "#FF6B1B" : "#374151",
                background: start || end ? "#1B4DFF" : range ? "#EEF2FF" : "transparent",
                borderRadius: 6,
                padding: "3px 0",
                cursor: past ? "default" : "pointer",
                transition: "background 0.1s",
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function TripPickerPanel({ initialCountrySlug }: { initialCountrySlug?: string }) {
  const router = useRouter();

  const initCountry = initialCountrySlug
    ? Math.max(0, COUNTRIES.findIndex(c => c.slug === initialCountrySlug))
    : 0;

  const [countryIdx, setCountryIdx] = useState(initCountry);
  const [daysIdx, setDaysIdx] = useState(2); // 7 days default
  const [typeIdx, setTypeIdx] = useState(0);
  const [budgetIdx, setBudgetIdx] = useState(1);

  // Calendar
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const month2 = calMonth === 11 ? 0 : calMonth + 1;
  const year2 = calMonth === 11 ? calYear + 1 : calYear;

  const onDayClick = (d: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
    } else {
      if (d < startDate) { setStartDate(d); setEndDate(null); }
      else { setEndDate(d); }
    }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const countryItems = COUNTRIES.map(c => `${c.flag} ${c.name}`);
  const daysItems = DAYS.map(d => `${d} дн.`);
  const typeItems = TRIP_TYPES.map(t => `${t.emoji} ${t.label}`);
  const budgetItems = BUDGETS.map(b => `${b.emoji} ${b.label}`);

  const handleSubmit = () => {
    const c = COUNTRIES[countryIdx];
    const d = DAYS[daysIdx];
    const t = TRIP_TYPES[typeIdx].label;
    const b = BUDGETS[budgetIdx].label;
    const params = new URLSearchParams({ country: c.name, days: String(d), type: t, budget: b });
    if (startDate) params.set("from", startDate.toISOString().slice(0,10));
    if (endDate) params.set("to", endDate.toISOString().slice(0,10));
    router.push(`/autopilot?${params.toString()}`);
  };

  return (
    <div style={{
      background: "white",
      borderTop: "1px solid #E5E7EB",
      padding: "12px 20px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* Top row: drums + calendar */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* Drums section */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Labels */}
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { label: "Куда", flex: 3 },
              { label: "Дней", flex: 2 },
              { label: "Вид отдыха", flex: 3 },
              { label: "Бюджет", flex: 2 },
            ].map(({ label, flex }) => (
              <div key={label} style={{
                flex, textAlign: "center",
                fontSize: 10, fontWeight: 600,
                color: "#9CA3AF", letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Drums row */}
          <div style={{
            display: "flex",
            height: ITEM_H * VISIBLE,
            border: "1px solid #F3F4F6",
            borderRadius: 14,
            overflow: "hidden",
            background: "white",
            width: 380,
          }}>
            <Drum items={countryItems} selectedIndex={countryIdx} onChange={setCountryIdx} flex={3} />
            <div style={{ width: 1, background: "#F3F4F6", flexShrink: 0 }} />
            <Drum items={daysItems} selectedIndex={daysIdx} onChange={setDaysIdx} flex={2} />
            <div style={{ width: 1, background: "#F3F4F6", flexShrink: 0 }} />
            <Drum items={typeItems} selectedIndex={typeIdx} onChange={setTypeIdx} flex={3} />
            <div style={{ width: 1, background: "#F3F4F6", flexShrink: 0 }} />
            <Drum items={budgetItems} selectedIndex={budgetIdx} onChange={setBudgetIdx} flex={2} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "#F3F4F6", alignSelf: "stretch", flexShrink: 0 }} />

        {/* Calendar section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <button
              onClick={prevMonth}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6B7280", padding: "0 4px" }}
            >‹</button>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Даты поездки
            </span>
            <button
              onClick={nextMonth}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6B7280", padding: "0 4px" }}
            >›</button>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <MonthGrid year={calYear} month={calMonth} startDate={startDate} endDate={endDate} onDayClick={onDayClick} />
            <div style={{ width: 1, background: "#F3F4F6", flexShrink: 0 }} />
            <MonthGrid year={year2} month={month2} startDate={startDate} endDate={endDate} onDayClick={onDayClick} />
          </div>
          {(startDate || endDate) && (
            <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4, textAlign: "center" }}>
              {startDate ? startDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—"}
              {" → "}
              {endDate ? endDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "выберите дату"}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        style={{
          width: "100%",
          background: "#1B4DFF",
          color: "white",
          border: "none",
          borderRadius: 14,
          padding: "14px 0",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: 0.3,
        }}
      >
        ✦ Составить маршрут
      </button>
    </div>
  );
}
