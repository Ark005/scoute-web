import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getRoutes, getCities, getCityPOIs, getCityBudgets } from "@/lib/api";
import type { CityInfo, RouteListItem, CityPOI, CityBudget } from "@/lib/types";
import { aviasalesUrl } from "@/lib/transport";
import GeorgiaMapClient from "@/components/GeorgiaMapClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Грузия — путеводитель и маршруты | Scoute",
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

// API возвращает name на латинице для части городов (старые seed'ы).
// Русские имена для display.
const CITY_DISPLAY_NAMES: Record<string, string> = {
  tbilisi: "Тбилиси",
  batumi: "Батуми",
  kutaisi: "Кутаиси",
  mtskheta: "Мцхета",
  sighnaghi: "Сигнахи",
  telavi: "Телави",
  borjomi: "Боржоми",
  bakuriani: "Бакуриани",
  gudauri: "Гудаури",
  kazbegi: "Казбеги",
  mestia: "Местия",
  khevsureti: "Хевсуретия",
  tusheti: "Тушетия",
  racha: "Рача",
  chiatura: "Чиатура",
  javakheti: "Джавахетия",
  gori: "Гори",
};

const HERO_IMAGE = "https://scoute.app/media/cached_images/attraction_1244_c08aca0098.jpg"; // Sameba

function isGeorgianRoute(r: RouteListItem): boolean {
  return r.slug.startsWith("georgia-");
}

function absUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `https://scoute.app${url}`;
  return url;
}

// POI с такими названиями встречаются как дубли в нескольких городах — не использовать как hero.
const ALIEN_POI_PATTERNS = [
  /варзия/i, /вардзи/i, /уплисци/i, /самеба/i, /светицховели/i, /гелати/i, /баграти/i,
];

// Город → подсказка какой POI взять как hero (по подстроке имени)
const CITY_PREFERRED_HERO: Record<string, RegExp[]> = {
  kutaisi: [/баграт/i, /гелати/i, /колхет/i, /кутаис/i],
  borjomi: [/боржоми/i, /парк/i, /романо/i, /харагаул/i],
  mtskheta: [/светицховел/i, /джвари/i, /мцхет/i],
  sighnaghi: [/сигнах/i, /бодбе/i, /давид/i],
  telavi: [/алаверд/i, /телав/i, /икалто/i, /цинандал/i],
  gori: [/уплисци/i, /гори/i, /сталин/i],
  bakuriani: [/бакуриан/i, /трасс/i, /склон/i],
  gudauri: [/гудаур/i, /крест/i, /арка/i],
  kazbegi: [/гергет/i, /казбек/i, /казбеги/i, /степанцм/i],
  mestia: [/местиа/i, /мест/i, /сван/i, /ушгул/i, /уш/i],
  javakheti: [/паравани/i, /карцах/i, /сагамо/i, /джавахет/i],
  racha: [/шови/i, /рача/i, /уцера/i, /амбролаур/i],
  chiatura: [/чиатур/i, /канатн/i],
  khevsureti: [/шатил/i, /хевсур/i],
  tusheti: [/тушет/i, /омало/i, /дикло/i],
  tbilisi: [/самеба/i, /нарикал/i, /цминд/i, /метех/i],
  batumi: [/набережн/i, /али и нино/i, /пьяцца/i, /ботанич/i, /батум/i],
};

async function getCityHero(slug: string): Promise<{ name: string; image: string; pois_count: number } | null> {
  try {
    const data = await getCityPOIs(slug);
    const all = data.attractions.filter((a: CityPOI) => a.image_url);
    if (all.length === 0) return null;

    const preferred = CITY_PREFERRED_HERO[slug] || [];
    // Кандидат по подсказке
    let pick: CityPOI | undefined;
    for (const re of preferred) {
      pick = all.find((a) => re.test(a.name));
      if (pick) break;
    }
    // Иначе — первый POI чьё имя НЕ совпадает с known-чужой (Вардзия/Самеба и т.п. — общеизвестные landmarks
    // которые попадают в несколько городов как дубли в БД).
    if (!pick) {
      pick = all.find((a) => !ALIEN_POI_PATTERNS.some((re) => re.test(a.name))) || all[0];
    }
    return {
      name: pick.name,
      image: absUrl(pick.image_url),
      pois_count: data.attractions.length + data.restaurants.length,
    };
  } catch {
    return null;
  }
}

export default async function GeorgiaPage() {
  const [allCities, allRoutes, allBudgets] = await Promise.all([
    getCities().catch(() => [] as CityInfo[]),
    getRoutes().catch(() => [] as RouteListItem[]),
    getCityBudgets().catch(() => [] as CityBudget[]),
  ]);

  const georgianSet = new Set(GEORGIA_CITY_SLUGS);
  const cities = allCities.filter((c) => georgianSet.has(c.slug));
  const routes = allRoutes.filter(isGeorgianRoute);
  const budgets = allBudgets.filter((b) => georgianSet.has(b.slug));
  const tbilisiBudget = budgets.find((b) => b.slug === "tbilisi") || budgets[0] || null;

  const heroData = await Promise.all(cities.map((c) => getCityHero(c.slug)));
  const cityCards = cities.map((c, i) => ({
    ...c,
    hero: heroData[i],
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": "Грузия",
    "description":
      "Путеводитель по Грузии: Тбилиси, Кахетия, Сванетия, Казбеги. Авторские маршруты, города и сёла, гастрономия, вино, треккинг.",
    "url": "https://scoute.app/georgia",
    "image": HERO_IMAGE,
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className="relative w-full" style={{ height: "min(70vh, 560px)", minHeight: 360 }}>
        <Image
          src={HERO_IMAGE}
          alt="Собор Самеба, Тбилиси"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-screen-xl mx-auto w-full px-4 pb-10 md:pb-16">
            <div className="text-white/80 text-xs md:text-sm uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
              <span className="text-2xl md:text-3xl">🇬🇪</span>
              <span>Гид Scoute · Спецпроект</span>
            </div>
            <h1
              className="text-white font-extrabold leading-[0.95] mb-4"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "clamp(56px, 12vw, 140px)",
                letterSpacing: "-0.03em",
              }}
            >
              Грузия
            </h1>
            <p
              className="text-white/90 max-w-2xl leading-relaxed"
              style={{ fontSize: "clamp(15px, 1.5vw, 19px)" }}
            >
              26 веков письменности. Свой алфавит, своя музыка, свои тосты.
              Между Чёрным морем и Кавказом — альпийские луга, винные долины,
              башни Сванетии и серные бани Тбилиси.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                href="/autopilot"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition hover:scale-105"
                style={{ background: "var(--blue)" }}
              >
                🤖 Собрать маршрут с AI
              </Link>
              <Link
                href="#cities"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold backdrop-blur transition hover:bg-white/20"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                Города и регионы ↓
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAP — country regions */}
      <section className="border-y" style={{ borderColor: "#E5E7EB" }}>
        <GeorgiaMapClient />
      </section>

      <main className="max-w-screen-xl mx-auto px-4 py-12">
        {/* Stats */}
        <section className="grid grid-cols-3 gap-3 md:gap-6 mb-16">
          {[
            { num: cities.length, label: "городов и регионов" },
            { num: routes.length, label: "авторских маршрутов" },
            { num: routes.reduce((s, r) => s + (r.distance_km || 0), 0), label: "км покрыто" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center md:text-left border-l-2 md:pl-4"
              style={{ borderColor: "var(--blue)" }}
            >
              <div
                className="font-extrabold leading-none"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: "clamp(36px, 5vw, 52px)",
                  color: "var(--dark)",
                }}
              >
                {s.num}
              </div>
              <div className="text-xs md:text-sm text-gray-500 mt-1.5 uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* Cities */}
        <section id="cities" className="mb-20 scroll-mt-20">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
              Куда ехать
            </div>
            <h2
              className="font-extrabold mb-3"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "clamp(28px, 4vw, 44px)",
                color: "var(--dark)",
              }}
            >
              Города и регионы
            </h2>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              От столичного Тбилиси до горных деревень Сванетии. Каждый город —
              отдельный гид: достопримечательности, рестораны, погода, бюджет.
            </p>
          </div>
          {cityCards.length === 0 ? (
            <div className="text-gray-500 text-sm">Города загружаются…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cityCards.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cities/${c.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    {c.hero?.image ? (
                      <Image
                        src={c.hero.image}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 text-4xl">
                        🏔
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div
                        className="font-bold text-2xl leading-tight mb-1"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {c.name}
                      </div>
                      <div className="text-xs text-white/80">
                        {c.hero?.pois_count ?? 0} мест и заведений
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Routes */}
        {routes.length > 0 && (
          <section className="mb-20">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                Готовые маршруты
              </div>
              <h2
                className="font-extrabold mb-3"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: "clamp(28px, 4vw, 44px)",
                  color: "var(--dark)",
                }}
              >
                Авторские маршруты
              </h2>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                Многодневные программы с привязкой к карте и расписанию.
                От винной Кахетии до трекинга в Хевсуретии.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {routes.map((r) => (
                <Link
                  key={r.slug}
                  href={`/routes/${r.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    {r.cover_image ? (
                      <Image
                        src={r.cover_image}
                        alt={r.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-5xl">
                        🗺
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="text-xs uppercase tracking-wider opacity-80 mb-1">
                        {r.duration_days} дн · {r.distance_km} км
                        {r.is_free ? " · бесплатно" : ""}
                      </div>
                      <div
                        className="font-bold text-2xl leading-tight"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {r.title}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Long-form SEO */}
        <section className="mb-20 max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
            Перед поездкой
          </div>
          <h2
            className="font-extrabold mb-8"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(28px, 4vw, 44px)",
              color: "var(--dark)",
            }}
          >
            Что нужно знать
          </h2>
          <div className="space-y-6 text-gray-700 leading-relaxed text-[17px]">
            <div>
              <h3 className="font-bold mb-2" style={{ color: "var(--dark)" }}>
                Виза
              </h3>
              <p>
                Гражданам РФ виза не нужна, разрешено находиться до 360 дней.
                На границе спросят цель визита и могут попросить показать обратный билет.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2" style={{ color: "var(--dark)" }}>
                Деньги
              </h3>
              <p>
                Местная валюта — лари (GEL). Менять рубли можно в обменниках, лучший
                курс у частных пунктов в Тбилиси на проспекте Руставели и у метро
                «Площадь Свободы». Карты Visa/MasterCard принимают почти везде.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2" style={{ color: "var(--dark)" }}>
                Транспорт
              </h3>
              <p>
                Между городами — маршрутки и поезда. Внутри Тбилиси — метро (1 лари),
                Bolt и Yandex Go. В горы (Сванетия, Хевсуретия, Тушетия) —
                только на внедорожнике, сезон июнь—сентябрь.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2" style={{ color: "var(--dark)" }}>
                Кухня
              </h3>
              <p>
                Хинкали — главные пельмени, едят руками за хвостик. Хачапури —
                по-аджарски (лодочка с яйцом), по-имеретински, по-мегрельски.
                Цыплёнок чкмерули в сливках, мцвади на углях, лобио в глиняном
                горшке. Вино — квеври, янтарное, оранжевое.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2" style={{ color: "var(--dark)" }}>
                Когда ехать
              </h3>
              <p>
                Май—июнь и сентябрь—октябрь — идеальное время. Лето в Тбилиси
                жаркое (+35), зима снежная в горах (Бакуриани, Гудаури —
                горнолыжный сезон). Сбор винограда (rtveli) — конец сентября,
                главный гастрономический повод.
              </p>
            </div>
          </div>
        </section>

        {/* Budget */}
        {tbilisiBudget && (() => {
          const hp = (v: any) => (typeof v === "number" ? v : v?.price ?? 0);
          const RUB = 92;
          const fmtRub = (usd: number) =>
            `₽${Math.round(usd * RUB).toLocaleString("ru-RU")}`;
          const transport = tbilisiBudget.transport_daily as unknown as number;
          const tiers = [
            {
              level: "budget" as const,
              label: "Бюджетно",
              hint: "хостел / гостевой дом, домашняя кухня, маршрутки",
              hotel: hp((tbilisiBudget.hotel as any).budget),
              meal: hp((tbilisiBudget.meal as any).budget),
              tone: { ring: "#10B981", bg: "#ECFDF5" },
            },
            {
              level: "mid" as const,
              label: "Достойно",
              hint: "3-4★ отель, рестораны, такси Bolt",
              hotel: hp((tbilisiBudget.hotel as any).mid),
              meal: hp((tbilisiBudget.meal as any).mid),
              tone: { ring: "#3B82F6", bg: "#EFF6FF" },
            },
            {
              level: "premium" as const,
              label: "Премиум",
              hint: "бутики, винные туры, дегустации, гид",
              hotel: hp((tbilisiBudget.hotel as any).premium),
              meal: hp((tbilisiBudget.meal as any).premium),
              tone: { ring: "#F59E0B", bg: "#FFFBEB" },
            },
          ];
          return (
            <section className="mb-20">
              <div className="mb-8">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Цена вопроса
                </div>
                <h2
                  className="font-extrabold mb-3"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: "clamp(28px, 4vw, 44px)",
                    color: "var(--dark)",
                  }}
                >
                  Во сколько обойдётся Грузия
                </h2>
                <p className="text-gray-600 max-w-2xl leading-relaxed">
                  Реальные цены по Тбилиси, на человека в день. Без перелёта.
                  Для других городов и автомаршрутов — точный расчёт ниже.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {tiers.map((t) => {
                  const daily = t.hotel + t.meal * 3 + transport;
                  return (
                    <div
                      key={t.level}
                      className="rounded-2xl p-6 transition hover:shadow-lg"
                      style={{ background: t.tone.bg, border: `1px solid ${t.tone.ring}30` }}
                    >
                      <div
                        className="text-xs uppercase tracking-wider font-bold mb-1"
                        style={{ color: t.tone.ring }}
                      >
                        {t.label}
                      </div>
                      <div
                        className="font-extrabold leading-none mb-1"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: "clamp(32px, 4vw, 44px)",
                          color: "var(--dark)",
                        }}
                      >
                        {fmtRub(daily)}
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        в день / человек
                      </div>
                      <div className="text-xs text-gray-600 mb-4 italic">{t.hint}</div>
                      <div className="space-y-1.5 text-sm" style={{ color: "var(--dark)" }}>
                        <div className="flex justify-between">
                          <span className="text-gray-500">🏨 Отель ночь</span>
                          <span className="font-mono font-semibold">{fmtRub(t.hotel)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">🍽 Еда (3 раза)</span>
                          <span className="font-mono font-semibold">{fmtRub(t.meal * 3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">🚗 Транспорт</span>
                          <span className="font-mono font-semibold">{fmtRub(transport)}</span>
                        </div>
                        <div
                          className="flex justify-between pt-2 mt-2 border-t"
                          style={{ borderColor: `${t.tone.ring}40`, color: "var(--dark)" }}
                        >
                          <span className="font-bold">Неделя на двоих</span>
                          <span className="font-mono font-bold">{fmtRub(daily * 7 * 2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap justify-center gap-3 mb-3">
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition hover:scale-105"
                  style={{ background: "var(--dark)", color: "white" }}
                >
                  💰 Расчёт по дням и городам
                </Link>
                <a
                  href={aviasalesUrl("TBS")}
                  target="_blank"
                  rel="noopener sponsored"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition hover:scale-105"
                  style={{ background: "#FF6B1B", color: "white" }}
                >
                  🛫 Найти билеты
                </a>
                <a
                  href="https://www.booking.com/searchresults.html?ss=Tbilisi%2C+Georgia"
                  target="_blank"
                  rel="noopener sponsored"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition hover:scale-105"
                  style={{ background: "#003B95", color: "white" }}
                >
                  🏨 Найти отель
                </a>
                <a
                  href="https://www.getyourguide.com/s/?q=Tbilisi"
                  target="_blank"
                  rel="noopener sponsored"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition hover:scale-105"
                  style={{ background: "#F47B21", color: "white" }}
                >
                  🎫 Экскурсии
                </a>
              </div>
              <div className="text-center text-xs text-gray-500">
                Цифры выше — ориентир. По кнопкам реальные цены и бронирование на партнёрских сайтах.
              </div>
            </section>
          );
        })()}

        {/* Bottom CTA */}
        <section
          className="rounded-3xl p-8 md:p-14 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #1E40AF 100%)" }}
        >
          <div className="relative">
            <h2
              className="text-white font-extrabold mb-4"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: "clamp(28px, 4vw, 44px)",
              }}
            >
              Не знаете с чего начать?
            </h2>
            <p className="text-white/90 mb-7 max-w-xl mx-auto leading-relaxed">
              Расскажите AI-помощнику что вам интересно — он соберёт маршрут под
              ваши даты, бюджет и темп. Можно сохранить и открыть в приложении
              в поездке.
            </p>
            <Link
              href="/autopilot"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold transition hover:scale-105"
              style={{ background: "white", color: "var(--dark)" }}
            >
              🤖 Открыть планировщик
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
