"use client";

import { localrentCountry, localrentUrl } from "@/lib/transport";

type Props = {
  fromCityLabel: string;
  toCityLabel: string;
  countrySlug: string | null;
};

export default function CityTransferBlock({ fromCityLabel, toCityLabel, countrySlug }: Props) {
  const rentCountry = localrentCountry(countrySlug);
  if (!rentCountry) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white" style={{ border: "1px dashed #CBD5E1" }}>
      <span className="text-xl">🚗</span>
      <div className="flex-1 text-sm" style={{ color: "var(--dark)" }}>
        <span className="font-semibold">Переезд:</span>{" "}
        <span className="text-gray-600">{fromCityLabel} → {toCityLabel}</span>
      </div>
      <a
        href={localrentUrl(rentCountry, { pickupCity: fromCityLabel, returnCity: toCityLabel })}
        target="_blank"
        rel="noopener sponsored"
        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
        style={{ background: "#1B4DFF" }}
      >
        Машина в аренду →
      </a>
    </div>
  );
}
