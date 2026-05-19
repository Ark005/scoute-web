import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRoute, getRoutes } from "@/lib/api";
import { routeToBoardDays } from "@/lib/route-to-board";
import TripKanban from "@/components/TripKanban";

export const revalidate = 3600;

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

  return (
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
        days={days as any}
        citySlug={citySlugs[0] || "tbilisi"}
        countrySlug="georgia"
      />
    </main>
  );
}
