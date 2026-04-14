"use client";

import Link from "next/link";
import { useState } from "react";
import { RouteListItem } from "@/lib/types";
import { REGION_LABELS } from "./RouteCatalog";

interface Props {
  route: RouteListItem;
}

const REGION_GRADIENTS: Record<string, string> = {
  moscow_region: "linear-gradient(135deg, #1B4DFF 0%, #7C3AED 100%)",
  central:       "linear-gradient(135deg, #059669 0%, #1B4DFF 100%)",
  south:         "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
  caucasus:      "linear-gradient(135deg, #10B981 0%, #0891B2 100%)",
  siberia:       "linear-gradient(135deg, #6366F1 0%, #1B4DFF 100%)",
  ural:          "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
  volga:         "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
  northwest:     "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
  cis:           "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
  europe:        "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
};

function GradientPlaceholder({ route }: { route: RouteListItem }) {
  const gradient = REGION_GRADIENTS[route.region] ?? "linear-gradient(135deg, #1B4DFF 0%, #7C3AED 100%)";
  const letter = route.title.charAt(0);
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
      <span className="text-white font-extrabold opacity-30" style={{ fontSize: "64px" }}>{letter}</span>
    </div>
  );
}

function CoverImage({ route }: { route: RouteListItem }) {
  const [broken, setBroken] = useState(false);
  if (!route.cover_image || broken) return <GradientPlaceholder route={route} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={route.cover_image}
      alt={route.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setBroken(true)}
    />
  );
}

export default function RouteCard({ route }: Props) {
  return (
    <Link href={`/routes/${route.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <CoverImage route={route} />
          {!route.is_free && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              💎 Премиум
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
            {route.duration_days} {dayWord(route.duration_days)}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--grey)" }}>
            {REGION_LABELS[route.region] ?? route.region}
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
            {(route.waypoints_preview ?? []).slice(0, 1).map((wp) => (
              <span
                key={wp.id}
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#1B4DFF15", color: "#1B4DFF" }}
              >
                {wp.name}
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
