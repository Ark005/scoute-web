"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pushTrip } from "@/lib/trip-history";

type Props = {
  citySlug: string;
  cityLabel: string;
  days: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
};

export default function QuickPlanButton({
  citySlug, cityLabel, days, className, style, label,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
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
      if (Array.isArray(program?.days)) {
        program.days = program.days.map((d: Record<string, unknown>) => ({ ...d, city_slug: citySlug }));
      }
      const today = new Date().toISOString().slice(0, 10);
      const toISO = new Date(Date.now() + (days - 1) * 86400000).toISOString().slice(0, 10);

      const r2 = await fetch("/api/trip/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${cityLabel} — ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дн"}`,
          country_slug: "georgia",
          city_slug: citySlug,
          program,
          meta: { days, date_from: today, date_to: toISO, budget: "Средний" },
          source: "quick_plan",
        }),
      });
      if (!r2.ok) throw new Error(`save ${r2.status}`);
      const saved = await r2.json();
      pushTrip({ id: saved.id, title: `${cityLabel} — ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дн"}`, citySlug, countrySlug: "georgia" });
      router.push(`/trip/${saved.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={className} style={style}>
      {loading ? "⏳ Собираем..." : (label || `✦ Готовый план: ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дн"} в ${cityLabel}`)}
    </button>
  );
}
