"use client";

import AffiliateDisclaimer from "@/components/AffiliateDisclaimer";
import { ostrovokUrl } from "@/lib/transport";

type Props = {
  cityName: string;
};

// Блок «Где остановиться» с кнопкой поиска отелей на Ostrovok.
// Сырая ссылка — TP Drive (layout.tsx) подменит на emrld.ltd?erid=...
// AffiliateDisclaimer сам найдёт erid в ближайшей ссылке после монтирования.
export default function HotelBlock({ cityName }: Props) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-12 mb-10">
      <div className="rounded-3xl p-6 md:p-8" style={{ background: "#FFF5F7" }}>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: "#1F2937" }}>
          Где остановиться в {cityName}
        </h2>
        <p className="text-sm md:text-base mb-5" style={{ color: "#4B5563" }}>
          Сравните цены и забронируйте отель напрямую — без посредников и переплат.
        </p>
        <div className="flex flex-col items-start">
          <a
            href={ostrovokUrl(cityName)}
            target="_blank"
            rel="noopener sponsored"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition hover:scale-105"
            style={{ background: "#E5174D", color: "white" }}
          >
            🏨 Найти отель на Ostrovok
          </a>
          <AffiliateDisclaimer />
        </div>
      </div>
    </section>
  );
}
