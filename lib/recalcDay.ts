// Локальный пересчёт времени точек дня + расстояний между ними.
// Использует haversine + средние скорости (пешком ≤2 км, иначе машина).
// Реальный backend-routing появится позже — тогда заменим вызовы.

type DaySlot = {
  type: string;
  time?: string;
  duration_min?: number;
  latitude?: number;
  longitude?: number;
  transfer_minutes?: number;
  transfer_mode?: "walk" | "car";
  transfer_km?: number;
  [k: string]: unknown;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function travel(distKm: number): { minutes: number; mode: "walk" | "car"; realKm: number } {
  const realKm = distKm * 1.3; // городской коэффициент кривизны улиц
  if (realKm <= 2.0) {
    return { minutes: Math.max(1, Math.round((realKm / 4) * 60)), mode: "walk", realKm };
  }
  return { minutes: Math.max(3, Math.round((realKm / 30) * 60)), mode: "car", realKm };
}

function parseTime(t?: string): number {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return 10 * 60;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime(mins: number): string {
  const total = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function recalcDay<T extends DaySlot>(slots: T[]): T[] {
  if (!slots || slots.length === 0) return slots;
  // Работаем только с реальными карточками; transit-слоты из старого бэка отбрасываем
  // (их роль теперь играют поля transfer_* на каждой следующей карточке).
  const cards = slots.filter((s) => s.type !== "transit");
  if (cards.length === 0) return slots;

  const startTime = parseTime(cards[0].time);
  let cursor = startTime + (cards[0].duration_min || 0);

  const out: T[] = cards.map((slot, i) => {
    if (i === 0) {
      return {
        ...slot,
        time: formatTime(startTime),
        transfer_minutes: 0,
        transfer_mode: undefined,
        transfer_km: 0,
      };
    }
    const prev = cards[i - 1];
    let transferMin = 10;
    let mode: "walk" | "car" = "walk";
    let realKm = 0;
    if (
      typeof slot.latitude === "number" &&
      typeof slot.longitude === "number" &&
      typeof prev.latitude === "number" &&
      typeof prev.longitude === "number"
    ) {
      const distKm = haversineKm(prev.latitude, prev.longitude, slot.latitude, slot.longitude);
      const t = travel(distKm);
      transferMin = t.minutes;
      mode = t.mode;
      realKm = Math.round(t.realKm * 10) / 10;
    }
    const arriveAt = cursor + transferMin;
    const next: T = {
      ...slot,
      time: formatTime(arriveAt),
      transfer_minutes: transferMin,
      transfer_mode: mode,
      transfer_km: realKm,
    };
    cursor = arriveAt + (slot.duration_min || 0);
    return next;
  });

  return out;
}
