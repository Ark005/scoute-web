import Link from "next/link";
import type { Metadata } from "next";
import { getRoutes, getCities } from "@/lib/api";
import type { CityInfo, RouteListItem } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Грузия — путеводитель и маршруты | Scout·E",
  description:
    "Гид по Грузии: Тбилиси, Батуми, Кахетия, Сванетия, Казбеги. Авторские маршруты, города и сёла, гастрономия, вино, треккинг. Собери свой маршрут с AI.",
  keywords: [
    "Грузия",
    "путешествие в Грузию",
    "маршрут по Грузии",
    "Тбилиси",
    "Батуми",
    "Кахетия",
    "Сванетия",
    "Казбеги",
    "грузинская кухня",
    "хинкали",
    "хачапури",
    "вино Грузия",
  ],
  openGraph: {
    title: "Грузия — путеводитель и маршруты",
    description:
      "Тбилиси, Кахетия, Сванетия, Казбеги. Маршруты, города, гастрономия. AI-планировщик.",
    url: "https://scoute.app/georgia",
    type: "website",
  },
};

const GEORGIA_CITY_SLUGS = [
  "tbilisi",
  "batumi",
  "kutaisi",
  "mtskheta",
  "sighnaghi",
  "telavi",
  "borjomi",
  "bakuriani",
  "gudauri",
  "kazbegi",
  "mestia",
  "khevsureti",
  "tusheti",
  "racha",
  "chiatura",
  "javakheti",
  "gori",
];

function isGeorgianRoute(r: RouteListItem): boolean {
  return r.slug.startsWith("georgia-");
}

export default async function GeorgiaPage() {
  const [allCities, allRoutes] = await Promise.all([
    getCities().catch(() => [] as CityInfo[]),
    getRoutes().catch(() => [] as RouteListItem[]),
  ]);

  const georgianSet = new Set(GEORGIA_CITY_SLUGS);
  const cities = allCities.filter((c) => georgianSet.has(c.slug));
  const routes = allRoutes.filter(isGeorgianRoute);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": "Грузия",
    "description":
      "Путеводитель по Грузии: Тбилиси, Кахетия, Сванетия, Казбеги. Авторские маршруты, города и сёла, гастрономия, вино, треккинг.",
    "url": "https://scoute.app/georgia",
    "touristType": ["Independent traveler", "Cultural tourism", "Gastronomy tourism", "Adventure tourism"],
    "containsPlace": cities.map((c) => ({
      "@type": "City",
      "name": c.name,
      "url": `https://scoute.app/cities/${c.slug}`,
    })),
    "subjectOf": routes.map((r) => ({
      "@type": "TouristTrip",
      "name": r.title,
      "url": `https://scoute.app/routes/${r.slug}`,
      "tripDuration": `P${r.duration_days}D`,
    })),
  };

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🇬🇪</span>
          <h1
            className="text-3xl md:text-4xl font-extrabold"
            style={{ color: "var(--dark)" }}
          >
            Грузия
          </h1>
        </div>
        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
          Маленькая страна с 26 веками собственного письменного языка, своим
          алфавитом и своей музыкой. Между Чёрным морем и Кавказским хребтом
          умещается всё: альпийские луга и винные долины, средневековые башни
          в горах и приморские курорты, древние монастыри над пропастями и
          самые длинные тосты, которые вы когда-либо услышите за столом.
        </p>
        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
          Грузию пересекают за неделю — но обычно она задерживает у себя на
          две, и потом ещё долго возвращается через память запахов: чурчхела,
          серные бани, дым от тонэ, базилик в свежем сыре, дым от мангала с
          мцвади. Это страна, в которой гость считается посланником бога — и
          вас будут кормить так, как если бы вы и правда им были.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/autopilot"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--blue)" }}
          >
            🤖 Собрать маршрут с AI
          </Link>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border transition hover:bg-gray-50"
            style={{
              borderColor: "#E5E7EB",
              background: "white",
              color: "var(--dark)",
            }}
          >
            💰 Посчитать бюджет
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 mb-10">
        <div className="rounded-xl p-4 text-center" style={{ background: "#F9FAFB" }}>
          <div className="text-2xl font-extrabold" style={{ color: "var(--dark)" }}>
            {cities.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">городов и регионов</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#F9FAFB" }}>
          <div className="text-2xl font-extrabold" style={{ color: "var(--dark)" }}>
            {routes.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">авторских маршрутов</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#F9FAFB" }}>
          <div className="text-2xl font-extrabold" style={{ color: "var(--dark)" }}>
            {routes.reduce((s, r) => s + (r.distance_km || 0), 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">км покрыто маршрутами</div>
        </div>
      </section>

      {/* Cities */}
      <section className="mb-12">
        <h2
          className="text-xl md:text-2xl font-extrabold mb-4"
          style={{ color: "var(--dark)" }}
        >
          Города и регионы
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-3xl">
          От столичного Тбилиси до горных деревень Сванетии. Каждый город —
          отдельный гид: достопримечательности, рестораны, погода, бюджет.
        </p>
        {cities.length === 0 ? (
          <div className="text-gray-500 text-sm">Города загружаются…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/cities/${c.slug}`}
                className="block rounded-xl border p-4 transition hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: "#E5E7EB", background: "white" }}
              >
                <div
                  className="font-semibold text-sm"
                  style={{ color: "var(--dark)" }}
                >
                  {c.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.attractions_count || 0} мест · {c.restaurants_count || 0} ресторанов
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Routes */}
      {routes.length > 0 && (
        <section className="mb-12">
          <h2
            className="text-xl md:text-2xl font-extrabold mb-4"
            style={{ color: "var(--dark)" }}
          >
            Авторские маршруты
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-3xl">
            Готовые многодневные маршруты с привязкой к карте и расписанию.
            От винной Кахетии до трекинга в Хевсуретии.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((r) => (
              <Link
                key={r.slug}
                href={`/routes/${r.slug}`}
                className="block rounded-xl border p-5 transition hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: "#E5E7EB", background: "white" }}
              >
                <div
                  className="font-extrabold text-base mb-2"
                  style={{ color: "var(--dark)" }}
                >
                  {r.title}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {r.duration_days} дн · {r.distance_km} км
                  {r.is_free ? " · бесплатно" : ""}
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--blue)" }}>
                  Открыть маршрут →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO long-form section */}
      <section className="mb-12 max-w-3xl">
        <h2
          className="text-xl md:text-2xl font-extrabold mb-4"
          style={{ color: "var(--dark)" }}
        >
          Что нужно знать о Грузии перед поездкой
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            <strong>Виза.</strong> Гражданам РФ виза не нужна, разрешено
            находиться до 360 дней. На границе спросят цель визита и могут
            попросить показать обратный билет.
          </p>
          <p>
            <strong>Деньги.</strong> Местная валюта — лари (GEL). Менять
            рубли можно в обменниках по всей стране, курс лучше у частных
            обменных пунктов в Тбилиси на проспекте Руставели и в районе
            метро «Площадь Свободы». Карты Visa/MasterCard принимают
            почти везде.
          </p>
          <p>
            <strong>Транспорт.</strong> Между городами — маршрутки и поезда.
            Внутри Тбилиси — метро (1 лари за поездку), Bolt и Yandex Go.
            В горы (Сванетия, Хевсуретия, Тушетия) — только на внедорожнике
            и в сезон июнь—сентябрь.
          </p>
          <p>
            <strong>Кухня.</strong> Хинкали — главные пельмени, едят руками,
            держа за хвостик. Хачапури — по-аджарски (лодочка с яйцом),
            по-имеретински, по-мегрельски. Цыплёнок чкмерули в сливках, мцвади
            на углях, лобио в глиняном горшке. И, конечно, вино — квеври
            (амфорное), янтарное, оранжевое.
          </p>
          <p>
            <strong>Когда ехать.</strong> Май—июнь и сентябрь—октябрь —
            идеальное время. Лето в Тбилиси жаркое (+35), зима снежная в
            горах (Бакуриани, Гудаури — горнолыжный сезон). Сбор винограда
            (rtveli) — конец сентября, главный гастрономический повод.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="rounded-2xl p-6 md:p-8 text-center mb-8"
        style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
      >
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          Не знаете с чего начать?
        </h2>
        <p className="text-white/90 mb-5 max-w-xl mx-auto">
          Расскажите AI-помощнику что вам интересно — он соберёт маршрут под
          ваши даты, бюджет и темп. Можно сохранить и открыть в приложении
          в поездке.
        </p>
        <Link
          href="/autopilot"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition hover:opacity-90"
          style={{ background: "white", color: "var(--dark)" }}
        >
          🤖 Открыть планировщик
        </Link>
      </section>
    </main>
  );
}
