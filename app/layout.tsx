import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://scoute.app"),
  title: "Scoute — Маршруты по России",
  description:
    "Авторские автомаршруты и городские гиды по городам России. Планируй путешествие с картой и оптимизацией маршрута.",
  // 436-ФЗ — возрастная маркировка контента. Travel/гид без насилия/эротики = 6+.
  other: {
    "age-classification": "6+",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@1,800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
        {/* Footer — 6+ маркер (436-ФЗ), Privacy ссылка */}
        <footer
          className="mt-auto py-6 px-4 text-xs"
          style={{ background: "#0F172A", color: "rgba(255,255,255,0.55)" }}
        >
          <div className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full font-bold"
                style={{ background: "rgba(255,255,255,0.1)", color: "white", fontSize: 11 }}
                title="Возрастное ограничение по 436-ФЗ"
              >
                6+
              </span>
              <span>© 2026 Scoute. Маршруты по Грузии и СНГ.</span>
            </div>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-white transition">
                Политика конфиденциальности
              </a>
              <a
                href="https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia"
                target="_blank"
                rel="noopener"
                className="hover:text-white transition"
              >
                Лицензии фото
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
