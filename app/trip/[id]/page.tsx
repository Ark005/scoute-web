import type React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

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

      {/* Program by days */}
      {days.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-xl font-extrabold mb-4" style={{ color: "var(--dark)" }}>
            Программа по дням
          </h2>
          <div className="space-y-5">
            {days.map((d: any, i: number) => {
              const items = getDayItems(d);
              const dayLabel =
                d.day_label || d.date || `День ${d.day || d.day_number || i + 1}`;
              return (
                <div
                  key={i}
                  className="rounded-2xl border p-5"
                  style={{ borderColor: "#E5E7EB", background: "white" }}
                >
                  <div
                    className="font-bold text-base mb-3"
                    style={{ color: "var(--dark)" }}
                  >
                    {dayLabel}
                  </div>
                  {items.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      План на этот день пока пуст.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it: any, j: number) => (
                        <li
                          key={j}
                          className="text-sm leading-relaxed"
                        >
                          {renderSlot(it)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border p-5 mb-8 text-sm text-gray-600" style={{ borderColor: "#E5E7EB", background: "white" }}>
          Программа сохранена в нестандартном формате. Содержимое:
          <pre className="mt-3 p-3 rounded-lg text-xs overflow-auto" style={{ background: "#F9FAFB", maxHeight: 240 }}>
{JSON.stringify(trip.program, null, 2)}
          </pre>
        </div>
      )}

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
