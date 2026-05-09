import Image from "next/image";
import { getTours } from "@/lib/api";
import type { Tour } from "@/lib/types";
import AffiliateDisclaimer from "./AffiliateDisclaimer";

const CATEGORY_LABEL: Record<string, string> = {
  sightseeing: "Обзорная",
  food: "Гастро",
  cultural: "Культурный",
  adventure: "Приключения",
  day_trip: "Однодневная поездка",
  museum: "Музей",
  wine: "Винный тур",
  hiking: "Трекинг",
  history: "Исторический",
};

const CATEGORY_ICON: Record<string, string> = {
  sightseeing: "🏛",
  food: "🍽",
  cultural: "🎭",
  adventure: "⛰",
  day_trip: "🚐",
  museum: "🖼",
  wine: "🍷",
  hiking: "🥾",
  history: "📜",
};

function formatDuration(hours: number | null): string {
  if (!hours) return "";
  if (hours < 1) return `${Math.round(hours * 60)} мин`;
  if (hours === Math.round(hours)) return `${hours} ч`;
  return `${hours.toFixed(1)} ч`;
}

function formatPrice(usd: number | null): string {
  if (!usd) return "";
  const rub = Math.round(usd * 92);
  return `от ₽${rub.toLocaleString("ru-RU")}`;
}

export default async function TourBlock({
  citySlug,
  title = "Готовые экскурсии на эти даты",
  hint = "Можно вшить в любой день программы — гид, трансфер и билеты включены.",
}: {
  citySlug: string;
  title?: string;
  hint?: string;
}) {
  const tours = await getTours(citySlug);
  if (!tours.length) return null;

  return (
    <section className="my-8">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1.5">
          Партнёрские экскурсии
        </div>
        <h3
          className="font-extrabold mb-1"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: "clamp(20px, 3vw, 28px)",
            color: "var(--dark)",
          }}
        >
          {title}
        </h3>
        <p className="text-sm text-gray-600">{hint}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tours.map((t: Tour) => (
          <a
            key={t.id}
            href={t.affiliate_url}
            target="_blank"
            rel="noopener sponsored"
            className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
              {t.image_url ? (
                <Image
                  src={t.image_url}
                  alt={t.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={t.image_url.startsWith("http") && !t.image_url.includes("scoute.app")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-5xl">
                  {CATEGORY_ICON[t.category] || "🎫"}
                </div>
              )}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-semibold" style={{ color: "var(--dark)" }}>
                {CATEGORY_ICON[t.category] || "🎫"} {CATEGORY_LABEL[t.category] || t.category}
              </div>
            </div>
            <div className="p-4">
              <div
                className="font-bold text-base leading-tight mb-2 line-clamp-2"
                style={{ color: "var(--dark)" }}
              >
                {t.name}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                {t.duration_hours ? <span>⏱ {formatDuration(t.duration_hours)}</span> : null}
                {t.rating ? (
                  <span>
                    ⭐ {t.rating.toFixed(1)}
                    {t.review_count ? ` · ${t.review_count}` : ""}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "var(--dark)" }}>
                  {formatPrice(t.price_usd) || "Уточнить"}
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "#F47B21", color: "white" }}
                >
                  Забронировать →
                </span>
              </div>
              <AffiliateDisclaimer variant="compact" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
