import Link from "next/link";
import { RouteListItem } from "@/lib/types";

interface Props {
  route: RouteListItem;
}

const TAG_COLORS: Record<string, string> = {
  История: "#7C3AED",
  Природа: "#059669",
  Гастрономия: "#D97706",
  Архитектура: "#0891B2",
  Культура: "#DB2777",
  Религия: "#6366F1",
};

export default function RouteCard({ route }: Props) {
  const accent = "#1B4DFF";

  return (
    <Link href={`/routes/${route.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {route.preview_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={route.preview_image}
              alt={route.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: `${accent}15` }}
            >
              🗺️
            </div>
          )}
          {route.is_premium && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              ✨ Премиум
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
            {route.duration_days} {dayWord(route.duration_days)}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--grey)" }}>
            {route.region}
          </p>
          <h2
            className="text-base font-bold leading-snug mb-2"
            style={{ color: "var(--dark)" }}
          >
            {route.title}
          </h2>

          {/* Stats */}
          <div className="flex gap-3 text-xs mt-auto pt-2" style={{ color: "var(--grey)" }}>
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              {route.distance_km} км
            </span>
            {route.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `${TAG_COLORS[tag] || accent}15`,
                  color: TAG_COLORS[tag] || accent,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function dayWord(n: number) {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}
