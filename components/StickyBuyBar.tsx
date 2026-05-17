"use client";

import { useEffect, useState } from "react";

type CTA = {
  label: string;
  emoji: string;
  href: string;
  bg: string;
};

export default function StickyBuyBar({ ctas }: { ctas: CTA[] }) {
  const [hidden, setHidden] = useState(false);

  // Прячем бар если пользователь у самого низа страницы (чтобы не закрывать footer).
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      setHidden(total - scrolled < 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!ctas.length) return null;

  return (
    <>
      {/* Spacer so content isn't covered when bar is visible */}
      <div aria-hidden style={{ height: 80 }} />
      <div
        className="fixed left-0 right-0 bottom-0 z-40 transition-transform"
        style={{
          transform: hidden ? "translateY(100%)" : "translateY(0)",
          background: "white",
          borderTop: "1px solid #E5E7EB",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div className="max-w-screen-xl mx-auto px-3 py-2 flex gap-2 overflow-x-auto">
          {ctas.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target="_blank"
              rel="noopener sponsored"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-white text-sm whitespace-nowrap transition hover:opacity-90 shrink-0"
              style={{ background: c.bg }}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
