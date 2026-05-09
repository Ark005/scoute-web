import type React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TripTimeline from "@/components/TripTimeline";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

type TripData = {
  id: string;
  title: string;
  country_slug: string;
  city_slug: string | null;
  program: any;
  meta: Record<string, any>;
  source: string;
  created_at: string;
  share_url: string;
};

async function getTrip(id: string): Promise<TripData | null> {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "ScouteSSR/1.0",
      "Referer": "https://scoute.app",
    };
    const isLocal = BASE.includes("localhost") || BASE.includes("127.0.0.1");
    if (!isLocal) {
      headers["Authorization"] = "Basic c2NvdXQ6U2NvdXQyMDI2IQ==";
    }
    const res = await fetch(`${BASE}/trip/${id}/`, { headers, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTrip(id);
  return {
    title: trip ? `${trip.title} | Scoute` : "Программа поездки | Scoute",
    description: trip
      ? `Программа поездки: ${trip.title}. Откройте в приложении или продолжайте планировать.`
      : "Программа поездки",
    robots: "noindex, nofollow",
  };
}

function getDays(program: any): any[] {
  if (!program) return [];
  if (Array.isArray(program?.days)) return program.days;
  if (Array.isArray(program?.itinerary)) return program.itinerary;
  if (Array.isArray(program)) return program;
  return [];
}

function getDayItems(day: any): any[] {
  if (!day) return [];
  if (Array.isArray(day.slots)) return day.slots;
  if (Array.isArray(day.items)) return day.items;
  if (Array.isArray(day.activities)) return day.activities;
  if (Array.isArray(day.poi)) return day.poi;
  if (Array.isArray(day.attractions)) return day.attractions;
  return [];
}

function renderSlot(it: any): React.ReactNode {
  const time = it.time || it.start_time || "";
  const name = it.name || it.poi_name || it.title || "";

  if (it.type === "transit") {
    const mode = it.mode || "walk";
    const min = it.minutes ?? it.duration_min ?? "";
    const km = it.distance_km != null ? `${it.distance_km} км` : "";
    const modeLabel: Record<string, string> = {
      walk: "пешком",
      car: "на машине",
      taxi: "на такси",
      transit: "транспортом",
    };
    return (
      <span className="text-xs text-gray-400 italic">
        ↓ {min ? `${min} мин ` : ""}
        {modeLabel[mode] || mode}
        {km ? ` (${km})` : ""}
      </span>
    );
  }

  if (it.type === "start") {
    return (
      <>
        <span className="font-mono text-gray-500 mr-2">{time || "—"}</span>
        <span className="font-semibold">📍 Старт: {name}</span>
      </>
    );
  }

  if (it.type === "lunch" || it.type === "dinner" || it.type === "breakfast") {
    const icon = it.type === "breakfast" ? "☕" : it.type === "dinner" ? "🌙" : "🍽";
    return (
      <>
        <span className="font-mono text-gray-500 mr-2">{time || "—"}</span>
        <span>{icon} {name || "Обед"}</span>
        {it.duration_min && (
          <span className="text-gray-500"> · {it.duration_min} мин</span>
        )}
      </>
    );
  }

  return (
    <>
      <span className="font-mono text-gray-500 mr-2">{time || "—"}</span>
      <span style={{ color: "var(--dark)" }}>{name}</span>
      {it.duration_min && (
        <span className="text-gray-500"> · {it.duration_min} мин</span>
      )}
      {it.description && !it.duration_min && (
        <span className="text-gray-500"> · {it.description}</span>
      )}
    </>
  );
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const days = getDays(trip.program);

  // Альтернативы для swap — все attractions города (без id'шек уже стоящих в маршруте)
  let alternativesByCity: Record<string, any[]> = {};
  if (trip.city_slug) {
    try {
      const resp = await fetch(`${BASE}/city-pois/?city=${trip.city_slug}`, {
        headers: {
          "User-Agent": "ScouteSSR/1.0",
          "Authorization": "Basic c2NvdXQ6U2NvdXQyMDI2IQ==",
          "Referer": "https://scoute.app",
        },
        next: { revalidate: 3600 },
      });
      if (resp.ok) {
        const d = await resp.json();
        const usedIds = new Set<number>();
        for (const day of days) {
          const items = getDayItems(day);
          for (const s of items) if (s.id) usedIds.add(s.id);
        }
        alternativesByCity[trip.city_slug] = (d.attractions || [])
          .filter((a: any) => a.image_url && !usedIds.has(a.id))
          .slice(0, 30);
      }
    } catch {}
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/autopilot"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Спланировать другую поездку
        </Link>
      </div>

      <h1
        className="text-2xl md:text-3xl font-extrabold mb-2"
        style={{ color: "var(--dark)" }}
      >
        {trip.title}
      </h1>
      <div className="text-sm text-gray-500 mb-6">
        {trip.country_slug && <span className="capitalize">{trip.country_slug}</span>}
        {trip.city_slug && <span> · {trip.city_slug}</span>}
        {trip.meta?.days && <span> · {trip.meta.days} дн</span>}
      </div>

      {/* Open in app CTA */}
      <div
        className="rounded-2xl p-5 mb-8"
        style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
      >
        <div className="text-white font-bold text-lg mb-1">
          📱 Откройте в приложении в поездке
        </div>
        <div className="text-white/90 text-sm mb-4">
          В приложении: аудиогид «Встреча», навигация, замена POI на ходу, оффлайн.
          Эта программа автоматически подтянется по ссылке.
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`scoute://trip/${trip.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:opacity-90"
            style={{ background: "white", color: "var(--dark)" }}
          >
            Открыть в Scoute
          </a>
          <button
            disabled
            title="App ещё в разработке"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold opacity-50 cursor-not-allowed"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            Скачать app (скоро)
          </button>
        </div>
      </div>

      {/* Program by days — interactive timeline */}
      {days.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-xl font-extrabold mb-4" style={{ color: "var(--dark)" }}>
            Программа по дням
          </h2>
          <TripTimeline
            tripId={trip.id}
            citySlug={trip.city_slug}
            days={days as any}
            alternativesByCity={alternativesByCity}
          />
        </section>
      ) : (
        <div className="rounded-2xl border p-5 mb-8 text-sm text-gray-600" style={{ borderColor: "#E5E7EB", background: "white" }}>
          Программа сохранена в нестандартном формате. Содержимое:
          <pre className="mt-3 p-3 rounded-lg text-xs overflow-auto" style={{ background: "#F9FAFB", maxHeight: 240 }}>
{JSON.stringify(trip.program, null, 2)}
          </pre>
        </div>
      )}

      {/* Buy CTAs */}
      <div className="my-8">
        <h3 className="text-lg font-extrabold mb-3" style={{ color: "var(--dark)" }}>
          Купить
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://www.aviasales.ru/search/MOW${(() => { const d = new Date(); d.setDate(d.getDate() + 30); return String(d.getDate()).padStart(2, "0") + String(d.getMonth() + 1).padStart(2, "0"); })()}TBS1?marker=521784`}
            target="_blank"
            rel="noopener sponsored"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
            style={{ background: "#FF6B1B" }}
          >
            🛫 Билеты в Грузию
          </a>
          <a
            href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(trip.city_slug || "Tbilisi")}%2C+Georgia`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
            style={{ background: "#003B95" }}
          >
            🏨 Отель {trip.city_slug ? `в ${trip.city_slug}` : ""}
          </a>
          <a
            href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(trip.city_slug || "Tbilisi")}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
            style={{ background: "#F47B21" }}
          >
            🎫 Экскурсии
          </a>
        </div>
      </div>

      {/* Share */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "#E5E7EB", background: "white" }}
      >
        <div className="font-semibold mb-2" style={{ color: "var(--dark)" }}>
          Поделиться программой
        </div>
        <div className="text-sm text-gray-600 mb-3">
          Эта ссылка работает в браузере и в приложении:
        </div>
        <div
          className="font-mono text-xs p-3 rounded-lg break-all"
          style={{ background: "#F9FAFB", color: "var(--dark)" }}
        >
          {trip.share_url}
        </div>
      </div>
    </main>
  );
}
