import Script from "next/script";
import AffiliateDisclaimer from "@/components/AffiliateDisclaimer";
import { ostrovokUrl } from "@/lib/transport";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Переход на Ostrovok — Scoute",
  robots: { index: false, follow: false },
};

// Тонкая redirect-страница для in-app браузера Flutter и других клиентов
// без Travelpayouts Drive. На странице одна affiliate-ссылка — Drive переписывает
// её на emrld.ltd?erid=... , AffiliateDisclaimer вытаскивает erid автоматически.
// Пользователь жмёт большую кнопку — переходит с правильной атрибуцией.
export default async function OstrovokRedirect({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const cityName = (city || "").trim() || "Тбилиси";

  return (
    <>
    <Script src="https://emrld.ltd/NTIxNzg0.js?t=521784" strategy="afterInteractive" />
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-3">🏨</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#1F2937" }}>
          Поиск отелей в {cityName}
        </h1>
        <p className="text-sm mb-6" style={{ color: "#4B5563" }}>
          Открываем поиск на Ostrovok.ru — сравните цены и забронируйте напрямую.
        </p>
        <div className="flex flex-col items-stretch">
          <a
            href={ostrovokUrl(cityName)}
            target="_blank"
            rel="noopener sponsored"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition hover:scale-105"
            style={{ background: "#E5174D", color: "white" }}
          >
            Открыть Ostrovok →
          </a>
          <AffiliateDisclaimer />
        </div>
      </div>
    </main>
    </>
  );
}
