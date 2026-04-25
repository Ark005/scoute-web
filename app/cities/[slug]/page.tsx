import { CITIES } from "@/lib/cities-data";
import { getCities, getCityPOIs, getCityPOIsFromAPI, getCityWeather } from "@/lib/api";
import { CityPOI, CityWeather } from "@/lib/types";
import { notFound } from "next/navigation";
import CityGuide from "@/components/CityGuide";
import type { Metadata } from "next";

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
    title: `${name} — городской гид | Scout·E`,
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

  return <CityGuide city={cityData} pois={pois} error={error} weather={weather} />;
}
