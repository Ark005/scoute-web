export type Guide = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  city: string;
  cityRu: string;
  hero: { src: string; alt: string };
  publishedAt: string;
  updatedAt: string;
  intro: string;
  body: string;
  voiceOfScout?: string;
  practical: {
    address?: string;
    howToGet: string;
    hours?: string;
    price?: string;
    bestTime?: string;
  };
  faq: Array<{ q: string; a: string }>;
  related: Array<{ title: string; href: string; subtitle?: string }>;
};

import { narikala } from "@/content/guides/narikala";
import { abanotubani } from "@/content/guides/abanotubani";

const GUIDES: Record<string, Guide> = {
  narikala,
  abanotubani,
};

export function getGuide(slug: string): Guide | null {
  return GUIDES[slug] ?? null;
}

export function getAllGuideSlugs(): string[] {
  return Object.keys(GUIDES);
}

export function getAllGuides(): Guide[] {
  return Object.values(GUIDES).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
}
