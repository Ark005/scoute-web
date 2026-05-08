import { CITIES } from "@/lib/cities-data";
import { getCities, getCityPOIs, getCityPOIsFromAPI, getCityWeather } from "@/lib/api";
import { CityPOI, CityWeather } from "@/lib/types";
import { notFound } from "next/navigation";
import CityGuide from "@/components/CityGuide";
import CityExplorer from "@/components/CityExplorer";
import type { Metadata } from "next";

// Города для которых используем новый Flutter-style explorer
const FLUTTER_STYLE_CITIES = new Set([
  "tbilisi", "batumi", "kutaisi", "mtskheta", "sighnaghi", "telavi", "kazbegi",
  "mestia", "borjomi", "bakuriani", "gudauri", "gori", "khevsureti", "tusheti",
  "racha", "chiatura", "javakheti",
]);

export const revalidate = 3600;

export async function generateStaticParams() {
  // Города из API (реальные, с POI)
  const apiCities = await getCities().catch(() => []);
  const apiSlugs = new Set(apiCities.map((c) => c.slug));

  // Объединяем с хардкодом (для городов без POI в Django)
  const allSlugs = new Set([
    ...apiSlugs,
    ...CITIES.map((c) => c.slug),
  ]);

  return Array.from(allSlugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  const name = city?.name || slug;
  const teaser = city?.teaser || `Городской гид по ${name}`;
  return {
    title: `${name} — городской гид | Scoute`,
    description: teaser,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);

  // Попробуем API с полными данными, fallback на старый endpoint
  let pois: CityPOI[] = [];
  let error: string | undefined;
  let weather: CityWeather | undefined;

  try {
    const data = await getCityPOIsFromAPI(slug);
    pois = [
      ...data.attractions,
      ...data.restaurants,
    ];
  } catch {
    // fallback на старый endpoint
    try {
      const data = await getCityPOIs(slug);
      pois = [...data.attractions, ...data.restaurants];
    } catch {
      error = city
        ? `Данные для ${city.name} ещё загружаются. Попробуйте позже.`
        : "Город не найден";
    }
  }

  if (!city && pois.length === 0) notFound();

  // Если город не в хардкоде, создаём минимальный объект
  const cityData = city || {
    name: slug,
    slug,
    region: "",
    emoji: "",
    teaser: "",
    tags: [],
    group: "",
  };

  try {
    weather = await getCityWeather(slug);
  } catch {
    // weather is optional
  }

  // Грузинские города → новый Flutter-style explorer (3 таба + planner + афиша + рестораны)
  if (FLUTTER_STYLE_CITIES.has(slug) && pois.length > 0) {
    const ruName = (CITIES.find((c) => c.slug === slug)?.name) || cityData.name;

    // Афиша
    let events: any[] = [];
    try {
      const r = await fetch(`https://scoute.app/api/events/${slug}/`, {
        headers: {
          "User-Agent": "ScouteSSR/1.0",
          "Authorization": "Basic c2NvdXQ6U2NvdXQyMDI2IQ==",
          "Referer": "https://scoute.app",
        },
        next: { revalidate: 3600 },
      });
      if (r.ok) {
        const d = await r.json();
        events = d.events || [];
      }
    } catch {}

    return <CityExplorer citySlug={slug} cityName={ruName} pois={pois} events={events} />;
  }

  return <CityGuide city={cityData} pois={pois} error={error} weather={weather} />;
}
