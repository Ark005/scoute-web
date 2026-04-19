import { CITIES } from "@/lib/cities-data";
import { getCityPOIs, getCityWeather } from "@/lib/api";
import { CityPOI, CityWeather } from "@/lib/types";
import { notFound } from "next/navigation";
import CityGuide from "@/components/CityGuide";
import type { Metadata } from "next";

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return {};
  return {
    title: `${city.name} — городской гид | Scout·E`,
    description: city.teaser,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  let pois: CityPOI[] = [];
  let error: string | undefined;
  let weather: CityWeather | undefined;

  try {
    const data = await getCityPOIs(slug);
    pois = [...data.attractions, ...data.restaurants];
  } catch {
    error = `Данные для ${city.name} ещё загружаются. Попробуйте позже.`;
    pois = [];
  }

  try {
    weather = await getCityWeather(slug);
  } catch {
    // weather is optional — fall back to undefined (shown as 🌤 --°)
  }

  return <CityGuide city={city} pois={pois} error={error} weather={weather} />;
}
