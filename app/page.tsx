import Link from "next/link";
import { getRoutes } from "@/lib/api";

export default async function HomePage() {
  const routes = await getRoutes().catch(() => []);
  const featured = routes.slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section
        className="px-5 pt-16 pb-14 text-white text-center"
        style={{ background: "var(--dark)" }}
      >
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-3xl font-extrabold mb-3">Путешествуй по России</h1>
        <p className="text-white/60 text-base max-w-md mx-auto mb-8">
          Авторские автомаршруты — от Подмосковья до Камчатки.
          Карта, планировщик, оптимизация маршрута.
        </p>
        <Link
          href="/routes"
          className="inline-block px-8 py-3.5 rounded-2xl text-white font-bold text-base transition hover:opacity-90"
          style={{ background: "var(--blue)" }}
        >
          Смотреть маршруты →
        </Link>
      </section>

      {/* Featured routes */}
      {featured.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold mb-5" style={{ color: "var(--dark)" }}>
            Популярные маршруты
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featured.map((r) => (
              <Link
                key={r.slug}
                href={`/routes/${r.slug}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group"
              >
                <p className="text-xs mb-1" style={{ color: "var(--grey)" }}>
                  {r.region}
                </p>
                <p
                  className="font-bold text-base leading-tight group-hover:text-blue-600 transition"
                  style={{ color: "var(--dark)" }}
                >
                  {r.title}
                </p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--grey)" }}>
                  <span>🚗 {r.distance_km} км</span>
                  <span>📅 {r.duration_days} д.</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
