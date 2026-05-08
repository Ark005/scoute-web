"use client";

import { useEffect, useRef, useState } from "react";

type Rest = {
  id: number;
  name: string;
  image_url: string;
  city_name?: string;
  cuisine?: string;
  rating?: number | null;
};

type Props = {
  restaurants: Rest[];
  /** ms between auto-advances. 0 = no auto */
  intervalMs?: number;
  title?: string;
  subtitle?: string;
};

export default function RotatingRestaurants({
  restaurants,
  intervalMs = 3500,
  title = "Куда есть в Грузии",
  subtitle = "Хинкали, чкмерули, лобиани, оджахури — настоящие места",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!intervalMs || paused || restaurants.length === 0) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % restaurants.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, paused, restaurants.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft - 16, behavior: "smooth" });
    }
  }, [index]);

  if (restaurants.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-4 mt-12 mb-8">
      <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">
            Гастрономия
          </div>
          <h2
            className="font-extrabold leading-tight"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(22px, 3vw, 32px)",
              color: "var(--dark)",
            }}
          >
            {title}
          </h2>
          <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: paused ? "#9CA3AF" : "#F97316",
              animation: paused ? undefined : "pulse 1.4s ease-in-out infinite",
            }}
          />
          {paused ? "пауза" : "вращение"}
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 5000)}
        className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {restaurants.map((r, i) => (
          <a
            key={r.id}
            href={`/poi/restaurant/${r.id}`}
            className="shrink-0 w-56 sm:w-64 snap-start group"
          >
            <div
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 transition-shadow"
              style={{
                border: i === index ? "2px solid #F97316" : "1px solid #E5E7EB",
                boxShadow: i === index ? "0 8px 24px rgba(249,115,22,0.25)" : undefined,
              }}
            >
              <img
                src={
                  r.image_url.startsWith("http")
                    ? r.image_url
                    : `https://scoute.app${r.image_url}`
                }
                alt={r.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div
                  className="font-bold leading-tight mb-1"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 18,
                  }}
                >
                  {r.name}
                </div>
                <div className="text-xs text-white/80 flex items-center gap-2">
                  {r.rating && <span>★ {r.rating.toFixed(1)}</span>}
                  {r.cuisine && <span>· {r.cuisine}</span>}
                  {r.city_name && <span>· {r.city_name}</span>}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
