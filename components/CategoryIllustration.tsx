// SVG illustrations by waypoint/route category — Roadtrippers style
import type { ReactElement } from "react";

const ILLUSTRATIONS: Record<string, { bg: string; svg: ReactElement }> = {
  history: {
    bg: "#2563EB",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Castle */}
        <rect x="6" y="30" width="10" height="22" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="4" y="24" width="14" height="8" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="4" y="20" width="4" height="6" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="10" y="20" width="4" height="6" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="27" y="20" width="10" height="32" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="30" y="14" width="4" height="8" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="48" y="30" width="10" height="22" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="46" y="24" width="14" height="8" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="46" y="20" width="4" height="6" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="52" y="20" width="4" height="6" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="6" y="45" width="52" height="3" rx="1" fill="white" fillOpacity="0.5"/>
      </svg>
    ),
  },
  museum: {
    bg: "#7C3AED",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Classic building with columns */}
        <polygon points="8,22 32,8 56,22" fill="white" fillOpacity="0.9"/>
        <rect x="10" y="22" width="44" height="4" rx="1" fill="white" fillOpacity="0.8"/>
        <rect x="12" y="26" width="6" height="22" rx="1" fill="white" fillOpacity="0.85"/>
        <rect x="22" y="26" width="6" height="22" rx="1" fill="white" fillOpacity="0.85"/>
        <rect x="36" y="26" width="6" height="22" rx="1" fill="white" fillOpacity="0.85"/>
        <rect x="46" y="26" width="6" height="22" rx="1" fill="white" fillOpacity="0.85"/>
        <rect x="10" y="46" width="44" height="4" rx="1" fill="white" fillOpacity="0.8"/>
      </svg>
    ),
  },
  nature: {
    bg: "#059669",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mountains + sun */}
        <circle cx="46" cy="18" r="8" fill="white" fillOpacity="0.9"/>
        <polygon points="4,50 22,20 40,50" fill="white" fillOpacity="0.8"/>
        <polygon points="24,50 40,28 56,50" fill="white" fillOpacity="0.9"/>
        <rect x="4" y="48" width="56" height="4" rx="1" fill="white" fillOpacity="0.6"/>
      </svg>
    ),
  },
  restaurant: {
    bg: "#D97706",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fork and knife */}
        <rect x="20" y="10" width="4" height="44" rx="2" fill="white" fillOpacity="0.9"/>
        <rect x="18" y="10" width="8" height="14" rx="3" fill="white" fillOpacity="0.7"/>
        <rect x="38" y="10" width="4" height="44" rx="2" fill="white" fillOpacity="0.9"/>
        <path d="M38 10 Q48 18 42 28 L38 28" fill="white" fillOpacity="0.7"/>
      </svg>
    ),
  },
  viewpoint: {
    bg: "#0891B2",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Binoculars */}
        <circle cx="22" cy="36" r="12" stroke="white" strokeWidth="4" strokeOpacity="0.9"/>
        <circle cx="42" cy="36" r="12" stroke="white" strokeWidth="4" strokeOpacity="0.9"/>
        <rect x="28" y="30" width="8" height="6" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="20" y="20" width="4" height="12" rx="2" fill="white" fillOpacity="0.8"/>
        <rect x="40" y="20" width="4" height="12" rx="2" fill="white" fillOpacity="0.8"/>
        <circle cx="22" cy="36" r="5" fill="white" fillOpacity="0.4"/>
        <circle cx="42" cy="36" r="5" fill="white" fillOpacity="0.4"/>
      </svg>
    ),
  },
  church: {
    bg: "#B45309",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dome + cross */}
        <rect x="29" y="6" width="6" height="14" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="24" y="11" width="16" height="4" rx="1" fill="white" fillOpacity="0.9"/>
        <path d="M16 32 Q32 14 48 32" fill="white" fillOpacity="0.8"/>
        <rect x="14" y="32" width="36" height="20" rx="2" fill="white" fillOpacity="0.85"/>
        <rect x="28" y="36" width="8" height="16" rx="1" fill="#B45309" fillOpacity="0.5"/>
      </svg>
    ),
  },
  beach: {
    bg: "#0284C7",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sun + wave */}
        <circle cx="44" cy="18" r="10" fill="white" fillOpacity="0.9"/>
        <path d="M4 38 Q12 30 20 38 Q28 46 36 38 Q44 30 52 38 Q58 44 60 38" stroke="white" strokeWidth="3.5" strokeOpacity="0.9" fill="none" strokeLinecap="round"/>
        <path d="M4 46 Q12 38 20 46 Q28 54 36 46 Q44 38 52 46 Q58 52 60 46" stroke="white" strokeWidth="3.5" strokeOpacity="0.7" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  hotel: {
    bg: "#4F46E5",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Building with H */}
        <rect x="10" y="16" width="44" height="36" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2.5" strokeOpacity="0.8"/>
        <rect x="14" y="22" width="8" height="8" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="28" y="22" width="8" height="8" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="42" y="22" width="8" height="8" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="14" y="34" width="8" height="8" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="42" y="34" width="8" height="8" rx="1" fill="white" fillOpacity="0.7"/>
        <rect x="26" y="42" width="12" height="10" rx="1" fill="white" fillOpacity="0.8"/>
        <rect x="10" y="50" width="44" height="2" rx="1" fill="white" fillOpacity="0.5"/>
      </svg>
    ),
  },
  default: {
    bg: "#1B4DFF",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Map pin with star */}
        <path d="M32 8C22 8 14 16 14 26C14 38 32 56 32 56C32 56 50 38 50 26C50 16 42 8 32 8Z" fill="white" fillOpacity="0.9"/>
        <circle cx="32" cy="26" r="8" fill="#1B4DFF" fillOpacity="0.6"/>
        <polygon points="32,20 33.8,24.5 38.5,24.5 34.8,27.5 36.2,32 32,29 27.8,32 29.2,27.5 25.5,24.5 30.2,24.5" fill="white" fillOpacity="0.9"/>
      </svg>
    ),
  },
};

function getCategoryStyle(category: string): { bg: string; svg: ReactElement } {
  const key = category?.toLowerCase();
  // Specific tags first (highest priority)
  if (key?.includes("храм") || key?.includes("пагод") || key?.includes("буддист")) return ILLUSTRATIONS.church;
  if (key?.includes("море") || key?.includes("пляж") || key?.includes("курорт") || key?.includes("черномор") || key?.includes("beach") || key?.includes("sea") || key?.includes("coast")) return ILLUSTRATIONS.beach;
  if (key?.includes("природ") || key?.includes("треккинг") || key?.includes("алтай") || key?.includes("байкал") || key?.includes("nature") || key?.includes("mountain")) return ILLUSTRATIONS.nature;
  if (key?.includes("истори") || key?.includes("юнеско") || key?.includes("кремл") || key?.includes("замок") || key?.includes("крепост") || key?.includes("history") || key?.includes("castle") || key?.includes("kremlin")) return ILLUSTRATIONS.history;
  if (key?.includes("гастроном") || key?.includes("еда") || key?.includes("ресторан") || key?.includes("food") || key?.includes("gastro")) return ILLUSTRATIONS.restaurant;
  if (key?.includes("религ") || key?.includes("православ") || key?.includes("монастыр") || key?.includes("собор") || key?.includes("мечет") || key?.includes("church") || key?.includes("cathedral") || key?.includes("temple") || key?.includes("mosque")) return ILLUSTRATIONS.church;
  if (key?.includes("смотров") || key?.includes("панорам") || key?.includes("view") || key?.includes("panoram")) return ILLUSTRATIONS.viewpoint;
  // Region tags (before generic "культура")
  if (key?.includes("азия") || key?.includes("asia")) return ILLUSTRATIONS.church;
  if (key?.includes("кавказ") || key?.includes("caucasus")) return ILLUSTRATIONS.nature;
  if (key?.includes("снг") || key?.includes("cis")) return ILLUSTRATIONS.history;
  if (key?.includes("скандинав") || key?.includes("европ") || key?.includes("europe")) return ILLUSTRATIONS.museum;
  if (key?.includes("ближн") || key?.includes("mideast")) return ILLUSTRATIONS.church;
  // Generic culture last
  if (key?.includes("музе") || key?.includes("культур") || key?.includes("искусств") || key?.includes("архитектур") || key?.includes("museum") || key?.includes("cultur") || key?.includes("art")) return ILLUSTRATIONS.museum;
  if (key?.includes("гор") || key?.includes("лес") || key?.includes("озер") || key?.includes("сибир") || key?.includes("park")) return ILLUSTRATIONS.nature;
  if (key?.includes("отел") || key?.includes("ночев") || key?.includes("hotel")) return ILLUSTRATIONS.hotel;
  if (key?.includes("шопинг") || key?.includes("рынок") || key?.includes("restaurant")) return ILLUSTRATIONS.restaurant;
  return ILLUSTRATIONS.default;
}

interface Props {
  category: string;
  size?: number;
}

export default function CategoryIllustration({ category, size = 80 }: Props) {
  const { bg, svg } = getCategoryStyle(category);
  return (
    <div
      style={{
        background: bg,
        width: size,
        height: size,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        flexShrink: 0,
      }}
    >
      <div style={{ width: size - 20, height: size - 20 }}>{svg}</div>
    </div>
  );
}

export { getCategoryStyle };
