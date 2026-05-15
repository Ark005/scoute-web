"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GeorgiaPlanCTA() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = parseInt(params.get("days") || "3", 10);
  const type = params.get("type") || "";
  const budget = params.get("budget") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const hasParams = params.has("days") || params.has("type");

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const citySlug = "tbilisi";
      const r1 = await fetch("/api/agent/build-from-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_slug: citySlug,
          days,
          must_see_names: [],
          fill_with_must_see: true,
          min_count: 5,
        }),
      });
      if (!r1.ok) throw new Error(`build ${r1.status}`);
      const program = await r1.json();

      const r2 = await fetch("/api/trip/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Тбилиси — ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дн"}`,
          country_slug: "georgia",
          city_slug: citySlug,
          program,
          meta: { days, type, budget, date_from: from, date_to: to },
          source: "georgia_cta",
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

  return (
    <section style={{ background: "white", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", padding: "24px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: -0.5 }}>
              Готовы спланировать?
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6, marginBottom: 0 }}>
              {hasParams
                ? `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} в Тбилиси${type ? ` · ${type}` : ""}${budget ? ` · ${budget}` : ""}`
                : "Соберём маршрут по Тбилиси за минуту — после можно править на доске"}
            </p>
            {error && <div style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
          </div>
          <button
            onClick={handleClick}
            disabled={loading}
            style={{
              background: loading ? "#6B7280" : "#1B4DFF",
              color: "white", border: "none", borderRadius: 14,
              padding: "14px 28px", fontSize: 15, fontWeight: 700,
              cursor: loading ? "default" : "pointer", letterSpacing: 0.2,
              transition: "background 0.2s",
            }}
          >
            {loading ? "⏳ Составляем..." : "✦ Составить маршрут"}
          </button>
        </div>
      </div>
    </section>
  );
}
