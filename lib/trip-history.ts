// Локальная история поездок этого устройства.
// Будет вытеснена backend-моделью когда добавим Django User.

const KEY = "scoute_trip_history_v1";
const LIMIT = 30;

export interface TripHistoryEntry {
  id: string;
  title: string;
  citySlug?: string;
  countrySlug?: string;
  createdAt: string;
}

function safeRead(): TripHistoryEntry[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeWrite(arr: TripHistoryEntry[]) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(arr.slice(0, LIMIT)));
  } catch { /* quota or SSR */ }
}

export function pushTrip(e: Omit<TripHistoryEntry, "createdAt"> & { createdAt?: string }) {
  const arr = safeRead();
  const next: TripHistoryEntry[] = [
    { ...e, createdAt: e.createdAt || new Date().toISOString() },
    ...arr.filter(x => x.id !== e.id),
  ];
  safeWrite(next);
}

export function getTrips(): TripHistoryEntry[] {
  return safeRead();
}

export function removeTrip(id: string) {
  safeWrite(safeRead().filter(x => x.id !== id));
}
