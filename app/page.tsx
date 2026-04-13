import Link from "next/link";
import { getFeaturedRoutes } from "@/lib/api";
import RouteCard from "@/components/RouteCard";

export default async function HomePage() {
  const featured = await getFeaturedRoutes().catch(() => []);

  return (
    <main>
      {/* Hero */}
      <section
        className="px-5 pt-20 pb-16 text-white text-center"
        style={{ background: "var(--dark)" }}
      >
        <div className="text-5xl mb-4">🚗</div>
        <h1 className="text-4xl font-extrabold mb-4 leading-tight max-w-xl mx-auto">
          Путешествуй по России на авто 🚗
        </h1>
        <p className="text-white/60 text-base max-w-md mx-auto mb-10">
          Авторские маршруты с картой, планировщиком и оптимизацией пути
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/routes"
            className="inline-block px-8 py-3.5 rounded-2xl text-white font-bold text-base transition hover:opacity-90"
            style={{ background: "var(--blue)" }}
          >
            Смотреть маршруты →
          </Link>
          <Link
            href="/autopilot"
            className="inline-block px-8 py-3.5 rounded-2xl text-white font-bold text-base transition hover:opacity-90"
            style={{ background: "var(--orange)" }}
          >
            Подобрать маршрут ✨
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-screen-xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "var(--dark)" }}>
          Как работает Scout·E
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🗺", title: "1. Выбери маршрут", desc: "Каталог авторских маршрутов по всей России — от Подмосковья до Байкала" },
            { icon: "📍", title: "2. Спланируй остановки", desc: "Интерактивная карта, список точек с описаниями, советы и время посещения" },
            { icon: "🚘", title: "3. Езжай с картой", desc: "Оптимизированный маршрут с навигацией прямо в браузере или смартфоне" },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-3 shadow-sm"
            >
              <div className="text-3xl">{card.icon}</div>
              <h3 className="font-bold text-base" style={{ color: "var(--dark)" }}>{card.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--grey)" }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured routes */}
      {featured.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pb-14">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--dark)" }}>
            Популярные маршруты
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.slice(0, 3).map((r) => (
              <RouteCard key={r.slug} route={r} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/routes"
              className="inline-block px-6 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ background: "var(--blue)" }}
            >
              Все маршруты →
            </Link>
          </div>
        </section>
      )}

      {/* Autopilot promo */}
      <section
        className="px-5 py-16 text-white text-center"
        style={{ background: "var(--dark)" }}
      >
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-2xl font-extrabold mb-3 max-w-md mx-auto">
          Автопилот подберёт маршрут за 30 секунд
        </h2>
        <p className="text-white/60 text-base max-w-sm mx-auto mb-8">
          Укажи регион, количество дней и интересы — Scout·E предложит идеальный маршрут
        </p>
        <Link
          href="/autopilot"
          className="inline-block px-8 py-3.5 rounded-2xl text-white font-bold text-base transition hover:opacity-90"
          style={{ background: "var(--orange)" }}
        >
          Попробовать
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ color: "var(--grey)" }}>Scout·E © 2026</p>
          <div className="flex gap-6 text-sm" style={{ color: "var(--grey)" }}>
            <Link href="/routes" className="hover:text-gray-900 transition">Маршруты</Link>
            <Link href="/autopilot" className="hover:text-gray-900 transition">Автопилот</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
