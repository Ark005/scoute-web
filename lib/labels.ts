import { CITIES } from "./cities-data";

const COUNTRY_LABELS: Record<string, string> = {
  georgia: "Грузия",
  russia: "Россия",
  armenia: "Армения",
  uzbekistan: "Узбекистан",
  kazakhstan: "Казахстан",
  kyrgyzstan: "Кыргызстан",
  azerbaijan: "Азербайджан",
  tajikistan: "Таджикистан",
  turkey: "Турция",
  cyprus: "Кипр",
  israel: "Израиль",
};

export function cityLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  const hit = CITIES.find((c) => c.slug === slug);
  if (hit) return hit.name;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function countryLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  return COUNTRY_LABELS[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
}

export function cityLocative(slug: string | null | undefined): string {
  const name = cityLabel(slug);
  if (!name) return "";
  const locatives: Record<string, string> = {
    Москва: "Москве",
    "Санкт-Петербург": "Санкт-Петербурге",
    Тбилиси: "Тбилиси",
    Батуми: "Батуми",
    Кутаиси: "Кутаиси",
    Ереван: "Ереване",
    Самарканд: "Самарканде",
    Стамбул: "Стамбуле",
    Прага: "Праге",
    Вена: "Вене",
    Будапешт: "Будапеште",
    Берлин: "Берлине",
    Рим: "Риме",
    Флоренция: "Флоренции",
    Барселона: "Барселоне",
    Париж: "Париже",
    Амстердам: "Амстердаме",
    Дубай: "Дубае",
  };
  return locatives[name] || name;
}
