import AIChat from "@/components/AIChat";
import RotatingRestaurants from "@/components/RotatingRestaurants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-планировщик маршрутов | Scoute",
  description:
    "Расскажите AI-помощнику что хотите от поездки — он соберёт маршрут под ваши даты, бюджет и темп. Сохраните и откройте в приложении в поездке.",
};

export const revalidate = 3600;

const GEORGIA_CITIES_FOR_RESTAURANTS = [
  { slug: "tbilisi", name: "Тбилиси" },
  { slug: "batumi", name: "Батуми" },
  { slug: "kutaisi", name: "Кутаиси" },
  { slug: "kazbegi", name: "Казбеги" },
  { slug: "telavi", name: "Телави" },
  { slug: "sighnaghi", name: "Сигнахи" },
  { slug: "mestia", name: "Местиа" },
  { slug: "borjomi", name: "Боржоми" },
];

async function getGeorgianRestaurants() {
  const headers: Record<string, string> = {
    "User-Agent": "ScouteSSR/1.0",
    "Authorization": "Basic c2NvdXQ6U2NvdXQyMDI2IQ==",
  };
  const results = await Promise.all(
    GEORGIA_CITIES_FOR_RESTAURANTS.map(async (c) => {
      try {
        const r = await fetch(
          `https://scoute.app/api/city-pois/?city=${c.slug}`,
          { headers, next: { revalidate: 3600 } },
        );
        if (!r.ok) return [];
        const d = await r.json();
        return (d.restaurants || [])
          .filter((x: any) => x.image_url)
          .slice(0, 3)
          .map((x: any) => ({
            id: x.id,
            name: x.name,
            image_url: x.image_url,
            city_name: c.name,
            cuisine: x.cuisine || x.category,
            rating: x.rating,
          }));
      } catch {
        return [];
      }
    }),
  );
  // Mix-shuffle to avoid all-Tbilisi at front
  const flat = results.flat();
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  return flat.slice(0, 16);
}

export default async function AutopilotPage() {
  const restaurants = await getGeorgianRestaurants();

  return (
    <main>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1
          className="text-2xl md:text-3xl font-extrabold mb-2"
          style={{ color: "var(--dark)" }}
        >
          🤖 AI-планировщик
        </h1>
        <p className="text-sm text-gray-600">
          Опишите поездку как другу — куда, на сколько, что важно. AI соберёт программу
          по часам, сохранит и пришлёт ссылку открыть в приложении.
        </p>
      </div>
      <AIChat />
      <RotatingRestaurants restaurants={restaurants} />
    </main>
  );
}
