"use client";

// Локальный черновик маршрута: пишется в localStorage, читается на /trip/draft
// и в Flutter-приложении через будущий sync-эндпоинт. Пока — только Web.

export type TripDraftItem =
  | {
      kind: "poi";
      id: number;
      name: string;
      city_slug?: string | null;
      image_url?: string | null;
      added_at: string; // ISO
    }
  | {
      kind: "event";
      id: number;
      name: string;
      event_date: string | null;
      event_time: string | null;
      event_type: string;
      image_url?: string | null;
      ticket_url?: string | null;
      added_at: string; // ISO
    };

// `Omit` on a union collapses to the intersection of keys; we need per-variant Omit.
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export type TripDraftItemInput = DistributiveOmit<TripDraftItem, "added_at">;

const KEY = "scout_trip_draft";
const EVT = "scout-trip-draft-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getTripDraft(): TripDraftItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: TripDraftItem[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function isInTripDraft(kind: TripDraftItem["kind"], id: number): boolean {
  return getTripDraft().some((x) => x.kind === kind && x.id === id);
}

export function addToTripDraft(item: TripDraftItemInput): TripDraftItem[] {
  const items = getTripDraft();
  if (items.some((x) => x.kind === item.kind && x.id === item.id)) return items;
  const next: TripDraftItem[] = [
    ...items,
    { ...(item as any), added_at: new Date().toISOString() },
  ];
  save(next);
  return next;
}

export function removeFromTripDraft(kind: TripDraftItem["kind"], id: number): TripDraftItem[] {
  const next = getTripDraft().filter((x) => !(x.kind === kind && x.id === id));
  save(next);
  return next;
}

export function clearTripDraft(): void {
  save([]);
}

export function subscribeTripDraft(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}
