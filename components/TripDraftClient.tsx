"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearTripDraft,
  getTripDraft,
  removeFromTripDraft,
  subscribeTripDraft,
  type TripDraftItem,
} from "@/lib/tripDraft";

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatEventDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function imageSrc(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `https://scoute.app${url}`;
  return url;
}

export default function TripDraftClient() {
  const [items, setItems] = useState<TripDraftItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getTripDraft());
    setHydrated(true);
    return subscribeTripDraft(() => setItems(getTripDraft()));
  }, []);

  if (!hydrated) {
    return <main className="max-w-3xl mx-auto px-4 py-12 text-gray-500 text-sm">Загружаю черновик…</main>;
  }

  const pois = items.filter((x) => x.kind === "poi") as Extract<TripDraftItem, { kind: "poi" }>[];
  const events = items.filter((x) => x.kind === "event") as Extract<TripDraftItem, { kind: "event" }>[];

  const handoffPayload = items.map((it) =>
    it.kind === "poi"
      ? `📍 ${it.name}${it.city_slug ? ` (${it.city_slug})` : ""}`
      : `🎟 ${it.name}${it.event_date ? ` — ${formatEventDate(it.event_date)}${it.event_time ? ` ${it.event_time}` : ""}` : ""}`,
  ).join("\n");

  const aiHref = `/autopilot${
    handoffPayload
      ? `?seed=${encodeURIComponent(`Хочу собрать программу из этого:\n${handoffPayload}`)}`
      : ""
  }`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">Главная</Link>
        {" / "}
        <span>Мой маршрут</span>
      </nav>

      <h1
        className="font-extrabold mb-2"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: "clamp(28px, 4vw, 44px)",
          color: "var(--dark)",
        }}
      >
        Мой маршрут
      </h1>
      <p className="text-gray-600 leading-relaxed mb-6">
        Места и события, которые вы добавили. Передайте список AI-агенту — он
        соберёт программу по часам с перемещениями и временем.
      </p>

      {items.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "white", border: "1px dashed #E5E7EB" }}
        >
          <div className="text-gray-700 font-semibold mb-2">Черновик пока пуст</div>
          <div className="text-gray-500 text-sm mb-4">
            Откройте страну, город или афишу и нажмите «+ В маршрут» на любой карточке.
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/georgia"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white transition hover:scale-105"
              style={{ background: "var(--blue, #2563EB)" }}
            >
              🇬🇪 Грузия
            </Link>
            <Link
              href="/cities"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition"
              style={{ background: "#F3F4F6", color: "var(--dark)" }}
            >
              Города
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Link
              href={aiHref}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-white transition hover:scale-105"
              style={{ background: "#FF6B1B" }}
            >
              ✨ Превратить в программу через AI
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm("Очистить черновик?")) clearTripDraft();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition hover:bg-gray-200"
              style={{ background: "#F3F4F6", color: "#0F172A" }}
            >
              Очистить
            </button>
            <span className="text-xs text-gray-500 ml-auto">
              {items.length} {items.length === 1 ? "позиция" : "позиций"}
            </span>
          </div>

          {pois.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-3">
                Места ({pois.length})
              </h2>
              <ul className="space-y-2">
                {pois.map((p) => (
                  <li
                    key={`poi-${p.id}`}
                    className="flex items-center gap-3 rounded-xl bg-white p-2"
                    style={{ border: "1px solid #E5E7EB" }}
                  >
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                      {p.image_url && (
                        <img
                          src={imageSrc(p.image_url)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-sm leading-tight"
                        style={{ color: "var(--dark)" }}
                      >
                        {p.name}
                      </div>
                      {p.city_slug && (
                        <div className="text-xs text-gray-500 capitalize">{p.city_slug}</div>
                      )}
                    </div>
                    <Link
                      href={`/poi/attraction/${p.id}`}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2"
                    >
                      ↗
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromTripDraft("poi", p.id)}
                      aria-label="Убрать"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {events.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-3">
                События ({events.length})
              </h2>
              <ul className="space-y-2">
                {events.map((e) => (
                  <li
                    key={`event-${e.id}`}
                    className="flex items-center gap-3 rounded-xl bg-white p-2"
                    style={{ border: "1px solid #E5E7EB" }}
                  >
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                      {e.image_url && (
                        <img
                          src={imageSrc(e.image_url)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-sm leading-tight"
                        style={{ color: "var(--dark)" }}
                      >
                        {e.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatEventDate(e.event_date)}
                        {e.event_time ? ` · ${e.event_time}` : ""}
                      </div>
                    </div>
                    {e.ticket_url && (
                      <a
                        href={e.ticket_url}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-gray-500 hover:text-gray-700 px-2"
                      >
                        Билет ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromTripDraft("event", e.id)}
                      aria-label="Убрать"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div
            className="rounded-2xl p-5 text-sm text-gray-600"
            style={{ background: "#F8F7F4", border: "1px solid #E5E7EB" }}
          >
            <div className="font-semibold mb-1" style={{ color: "var(--dark)" }}>
              Что дальше
            </div>
            Эти позиции пока хранятся в этом браузере. Чтобы получить программу
            по часам с перемещениями — нажмите «Превратить в программу через AI».
            Sync с приложением Scoute появится в следующей версии.
          </div>
        </>
      )}
    </main>
  );
}
