"use client";

import { useState } from "react";

const DAY_CHOICES = [1, 2, 3, 5, 7, 10];
const BUDGET_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "Эконом",  label: "Эконом",  emoji: "💸" },
  { value: "Средний", label: "Средний", emoji: "💰" },
  { value: "Комфорт", label: "Комфорт", emoji: "💎" },
  { value: "Премиум", label: "Премиум", emoji: "👑" },
];

export type OnboardingResult = {
  days: number;
  date_from: string;
  date_to: string;
  budget: string;
};

type Props = {
  title?: string;
  defaultDays?: number;
  hideDays?: boolean;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (r: OnboardingResult) => void;
};

function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TripOnboardingDialog({
  title = "Когда и сколько?", defaultDays = 3, hideDays = false,
  loading = false, error = null, onCancel, onConfirm,
}: Props) {
  const [days, setDays] = useState(defaultDays);
  const [dateFrom, setDateFrom] = useState<string>(todayISO());
  const [budget, setBudget] = useState<string>("Средний");

  const dateTo = addDaysISO(dateFrom, days - 1);

  const handleConfirm = () => {
    onConfirm({ days, date_from: dateFrom, date_to: dateTo, budget });
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <h3 className="text-xl font-extrabold mb-4" style={{ color: "var(--dark)" }}>{title}</h3>

        {!hideDays && (
          <>
            <div className="text-sm font-bold mb-2" style={{ color: "var(--dark)" }}>Сколько дней?</div>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {DAY_CHOICES.map(n => (
                <button
                  key={n}
                  onClick={() => setDays(n)}
                  className="px-3 py-1.5 rounded-lg text-sm transition"
                  style={{
                    background: days === n ? "#1B4DFF" : "white",
                    color: days === n ? "white" : "var(--dark)",
                    border: `1px solid ${days === n ? "#1B4DFF" : "#E5E7EB"}`,
                    fontWeight: days === n ? 700 : 500,
                  }}
                >
                  {n} {n === 1 ? "день" : n < 5 ? "дня" : "дн"}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="text-sm font-bold mb-2" style={{ color: "var(--dark)" }}>Когда едешь?</div>
        <input
          type="date"
          value={dateFrom}
          min={todayISO()}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm mb-1"
          style={{ border: "1px solid #E5E7EB", background: "white", color: "var(--dark)" }}
        />
        <div className="text-xs text-gray-500 mb-4">
          с {new Date(dateFrom).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          {" → "}
          по {new Date(dateTo).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </div>

        <div className="text-sm font-bold mb-2" style={{ color: "var(--dark)" }}>Бюджет?</div>
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {BUDGET_OPTIONS.map(b => (
            <button
              key={b.value}
              onClick={() => setBudget(b.value)}
              className="px-2 py-2 rounded-lg text-xs transition"
              style={{
                background: budget === b.value ? "#EFF6FF" : "white",
                color: "var(--dark)",
                border: `1px solid ${budget === b.value ? "#3B82F6" : "#E5E7EB"}`,
                fontWeight: budget === b.value ? 700 : 500,
              }}
            >
              <div className="text-base">{b.emoji}</div>
              <div>{b.label}</div>
            </button>
          ))}
        </div>

        {error && <div className="text-sm text-red-500 mb-3">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-white font-bold text-sm transition"
            style={{ background: loading ? "#6B7280" : "#1B4DFF", cursor: loading ? "default" : "pointer" }}
          >
            {loading ? "⏳ Собираем маршрут..." : "✦ Создать маршрут"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-xl text-sm transition"
            style={{ background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB" }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
