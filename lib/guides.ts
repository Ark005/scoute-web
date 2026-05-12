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
import { gergeti } from "@/content/guides/gergeti";
import { svetitskhoveli } from "@/content/guides/svetitskhoveli";
import { vardzia } from "@/content/guides/vardzia";

const GUIDES: Record<string, Guide> = {
  narikala,
  abanotubani,
  gergeti,
  svetitskhoveli,
  vardzia,
};

const PUBLISHED_SLUGS = new Set<string>(["abanotubani", "gergeti", "svetitskhoveli", "vardzia"]);

export function getGuide(slug: string): Guide | null {
  return GUIDES[slug] ?? null;
}

export function isGuidePublished(slug: string): boolean {
  return PUBLISHED_SLUGS.has(slug);
}

export function getAllGuideSlugs(): string[] {
  return Object.keys(GUIDES).filter((s) => PUBLISHED_SLUGS.has(s));
}

export function getAllGuides(): Guide[] {
  return Object.values(GUIDES)
    .filter((g) => PUBLISHED_SLUGS.has(g.slug))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
