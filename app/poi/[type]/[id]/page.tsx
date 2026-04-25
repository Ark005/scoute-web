import { notFound } from "next/navigation";
import { getCities, getCityPOIsFromAPI } from "@/lib/api";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";
const isLocal = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");

async function getPOIDetail(type: string, id: string) {
  const headers: Record<string, string> = {
    "User-Agent": "ScouteSSR/1.0 (+https://scoute.app)",
    Referer: "https://scoute.app",
  };
  if (!isLocal) {
    headers["Authorization"] = "Basic c2NvdXQ6U2NvdXQyMDI2IQ==";
  }
  const res = await fetch(`${BASE_URL}/poi/${type}/${id}/`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateStaticParams() {
  const cities = await getCities().catch(() => []);
  const params: { type: string; id: string }[] = [];

  for (const city of cities) {
    try {
      const data = await getCityPOIsFromAPI(city.slug);
      for (const a of data.attractions) {
        params.push({ type: "attraction", id: String(a.id) });
      }
      for (const r of data.restaurants) {
        params.push({ type: "restaurant", id: String(r.id) });
      }
    } catch {
      // skip
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}): Promise<Metadata> {
  const { type, id } = await params;
  const poi = await getPOIDetail(type, id);
  if (!poi) return {};

  const title =
    type === "attraction"
      ? `${poi.name} — достопримечательность | Scout·E`
      : `${poi.name} — ресторан | Scout·E`;

  const description = poi.description
    ? poi.description.slice(0, 160)
    : `${poi.name} — подробная информация, фото, рейтинг`;

  return {
    title,
    description,
    openGraph: {
      title: poi.name,
      description,
      images: poi.image_url ? [{ url: poi.image_url }] : [],
      type: "article",
    },
  };
}

export const revalidate = 3600;

export default async function POIPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;

  if (type !== "attraction" && type !== "restaurant") notFound();

  const poi = await getPOIDetail(type, id);
  if (!poi) notFound();

  const isAttraction = type === "attraction";
  const categoryLabel = isAttraction
    ? { museums: "Музей", parks: "Парк", history: "История", shopping: "Шопинг", religion: "Религия", architecture: "Архитектура", culture: "Культура" }[poi.category as string] || poi.category
    : { russian: "Русская", european: "Европейская", japanese: "Японская", chinese: "Китайская", caucasian: "Кавказская", other: "Другая" }[poi.cuisine_type as string] || poi.cuisine_type;

  const imageUrl = poi.image_url
    ? poi.image_url.startsWith("http")
      ? poi.image_url
      : `https://scoute.app${poi.image_url}`
    : null;

  // JSON-LD для Google
  const jsonLd = isAttraction
    ? {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        name: poi.name,
        description: poi.description,
        image: imageUrl,
        geo: {
          "@type": "GeoCoordinates",
          latitude: poi.latitude,
          longitude: poi.longitude,
        },
        aggregateRating: poi.rating
          ? { "@type": "AggregateRating", ratingValue: poi.rating, bestRating: 5 }
          : undefined,
        isAccessibleForFree: poi.free_entry ?? false,
      }
    : {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: poi.name,
        description: poi.description,
        image: imageUrl,
        telephone: poi.phone,
        url: poi.website,
        geo: {
          "@type": "GeoCoordinates",
          latitude: poi.latitude,
          longitude: poi.longitude,
        },
        priceRange: poi.price_range,
        servesCuisine: poi.cuisine_type,
        aggregateRating: poi.rating
          ? { "@type": "AggregateRating", ratingValue: poi.rating, bestRating: 5 }
          : undefined,
      };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/cities" className="hover:underline">
          Города
        </Link>
        {" / "}
        <span>{isAttraction ? "Достопримечательности" : "Рестораны"}</span>
      </nav>

      {imageUrl && (
        <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
          <Image
            src={imageUrl}
            alt={poi.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">{poi.name}</h1>

      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {categoryLabel}
        </span>
        {poi.rating && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            {poi.rating}/5
          </span>
        )}
        {isAttraction && poi.free_entry && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
            Бесплатно
          </span>
        )}
        {!isAttraction && poi.price_range && (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            {poi.price_range}
          </span>
        )}
        {poi.avg_time_min && (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            ~{poi.avg_time_min} мин
          </span>
        )}
      </div>

      {poi.description && (
        <div className="prose prose-lg mb-6">
          <p>{poi.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {poi.latitude && poi.longitude && (
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="font-medium">Координаты:</span>{" "}
            <a
              href={`https://maps.google.com/?q=${poi.latitude},${poi.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
            </a>
          </div>
        )}
        {!isAttraction && poi.phone && (
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="font-medium">Телефон:</span>{" "}
            <a href={`tel:${poi.phone}`} className="text-blue-600">
              {poi.phone}
            </a>
          </div>
        )}
        {!isAttraction && poi.website && (
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="font-medium">Сайт:</span>{" "}
            <a
              href={poi.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {poi.website}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
