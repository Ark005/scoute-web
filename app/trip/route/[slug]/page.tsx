import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRoute, getRoutes, getCityPOIs } from "@/lib/api";
import type { CityPOI } from "@/lib/types";
import { routeToBoardDays, cityRu } from "@/lib/route-to-board";
import { ostrovokUrl } from "@/lib/transport";
import TripKanban from "@/components/TripKanban";
import SafeImg from "@/components/SafeImg";

export const revalidate = 3600;

// Цена бензина в Грузии — ориентир для оценки. Вынесено константой, чтобы
// правка была в одном месте; в UI показываем как явное допущение.
const GEL_PER_LITER = 2.7;

// SSG только для грузинских маршрутов: countrySlug страницы захардкожен «georgia»,
// а routeToBoardDays группирует по координатам грузинских городов.
export async function generateStaticParams() {
  const routes = await getRoutes().catch(() => []);
  return routes
    .filter((r) => r.slug.startsWith("georgia-"))
    .map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = await getRoute(slug).catch(() => null);
  return {
    title: route ? `${route.title} — доска маршрута | Scoute` : "Доска маршрута | Scoute",
    description: route
      ? `Соберите свою поездку на основе маршрута «${route.title}»: перетаскивайте точки между днями.`
      : "Доска маршрута",
    robots: "noindex, nofollow",
  };
}

function dayWord(n: number): string {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}

export default async function RouteBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getRoute(slug).catch(() => null);
  if (!route) notFound();

  const { days, citySlugs } = routeToBoardDays(route);
  if (days.length === 0) notFound();

  // Рестораны по городам маршрута — у waypoint'ов авторских маршрутов их нет,
  // тянем из базы городов (как панель «Рестораны» на доске).
  const cityPois = await Promise.all(
    citySlugs.map((s) =>
      getCityPOIs(s).catch(() => ({ attractions: [] as CityPOI[], restaurants: [] as CityPOI[] })),
    ),
  );
  const cityBlocks = citySlugs.map((citySlug, i) => ({
    slug: citySlug,
    label: cityRu(citySlug),
    restaurants: (cityPois[i].restaurants || []).filter((r) => r.image_url).slice(0, 4),
  }));

  // Оценка бензина — чистая арифметика по данным маршрута.
  const fuelLiters =
    route.fuel_consumption_l100 && route.distance_km
      ? Math.round((route.distance_km / 100) * route.fuel_consumption_l100)
      : null;
  const fuelCostGel = fuelLiters != null ? Math.round(fuelLiters * GEL_PER_LITER) : null;

  return (
    <>
      <Script src="https://emrld.ltd/NTIxNzg0.js?t=521784" strategy="afterInteractive" />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link href="/georgia" className="text-sm text-gray-500 hover:text-gray-700">
            ← Грузия
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold mb-1" style={{ color: "var(--dark)" }}>
          {route.title}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Черновик поездки · {days.length} {dayWord(days.length)}. Перетаскивайте точки между
          днями — изменения сохранятся автоматически.
        </p>

        {/* Доска-черновик: TripKanban без tripId. Первая правка (drag/добавление города)
            создаёт поездку через POST /api/trip/ и переводит на /trip/{id}. */}
        <TripKanban
          tripId=""
          tripTitle={route.title}
          days={days as never}
          citySlug={citySlugs[0] || "tbilisi"}
          countrySlug="georgia"
        />

        {/* Дорога и бензин */}
        {fuelLiters != null && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold mb-4" style={{ color: "var(--dark)" }}>
              Дорога и бензин
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "🚗", value: `${route.distance_km} км`, label: "протяжённость" },
                { icon: "⛽", value: `${route.fuel_consumption_l100} л`, label: "расход / 100 км" },
                { icon: "🛢", value: `≈ ${fuelLiters} л`, label: "бензина на маршрут" },
                { icon: "💸", value: `≈ ${fuelCostGel} ₾`, label: "на бензин" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-white p-3 flex items-center gap-2"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--dark)" }}>
                      {s.value}
                    </div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Оценка бензина при цене ~{GEL_PER_LITER.toLocaleString("ru-RU")} ₾/л — уточняйте на заправке.
            </p>
          </section>
        )}

        {/* Где остановиться и поесть — по городам маршрута */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--dark)" }}>
            Где остановиться и поесть
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Отели и рестораны по городам маршрута. Рестораны можно перетащить в дни на доске выше.
          </p>
          <div className="space-y-7">
            {cityBlocks.map((cb) => (
              <div key={cb.slug}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-base" style={{ color: "var(--dark)" }}>
                    {cb.label}
                  </h3>
                  <a
                    href={ostrovokUrl(cb.label)}
                    target="_blank"
                    rel="noopener sponsored"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: "#E5174D" }}
                  >
                    🏨 Отели в {cb.label}
                  </a>
                </div>
                {cb.restaurants.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {cb.restaurants.map((r) => (
                      <Link
                        key={r.id}
                        href={`/poi/restaurant/${r.id}`}
                        className="block rounded-xl overflow-hidden bg-white transition hover:shadow-md"
                        style={{ border: "1px solid #E5E7EB" }}
                      >
                        <SafeImg
                          src={r.image_url}
                          alt={r.name}
                          w={400}
                          h={200}
                          fit="cover"
                          className="w-full h-24 object-cover"
                          fallback={
                            <div className="w-full h-24 flex items-center justify-center text-3xl bg-gray-100">
                              🍴
                            </div>
                          }
                        />
                        <div className="p-2">
                          <div className="text-xs font-bold leading-tight" style={{ color: "var(--dark)" }}>
                            {r.name}
                          </div>
                          {(r.cuisine_type || r.rating) && (
                            <div className="text-[10px] text-gray-500 mt-1">
                              {r.cuisine_type || ""}
                              {r.cuisine_type && r.rating ? " · " : ""}
                              {r.rating ? `★ ${r.rating.toFixed(1)}` : ""}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Рестораны для города пока не добавлены в базу.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
