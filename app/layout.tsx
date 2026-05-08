import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://scoute.app"),
  title: "Scoute — Маршруты по России",
  description:
    "Авторские автомаршруты и городские гиды по городам России. Планируй путешествие с картой и оптимизацией маршрута.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full flex flex-col">
        <Script
          src="https://emrld.ltd/NTIxNzg0.js?t=521784"
          strategy="beforeInteractive"
        />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
