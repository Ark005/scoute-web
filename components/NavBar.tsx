"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/georgia", label: "Грузия" },
  { href: "/routes", label: "Маршруты" },
  { href: "/cities", label: "Города" },
  { href: "/autopilot", label: "AI-чат" },
  { href: "/calculator", label: "Калькулятор" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className="w-full"
      style={{ background: "var(--dark)", height: "56px", position: "sticky", top: 0, zIndex: 100 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Scoute — на главную"
          className="hover:opacity-90 transition shrink-0"
        >
          <Logo size={30} animated wordmark variant="light" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition"
              style={{
                color: isActive(link.href) ? "var(--blue)" : "rgba(255,255,255,0.75)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster: mic + CTA */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/autopilot?voice=1"
            aria-label="Голосовой ввод"
            title="Сказать голосом — открыть AI-чат"
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white/10"
            style={{ color: "white" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </Link>
          <Link
            href="/autopilot"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition hover:scale-105"
            style={{ background: "#FF6B1B", color: "white" }}
          >
            ✨ Составить маршрут
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1 text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
        >
          <span
            className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden absolute left-0 right-0 top-14 shadow-lg z-50 py-2"
          style={{ background: "var(--dark)" }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium transition"
              style={{
                color: isActive(link.href) ? "var(--blue)" : "rgba(255,255,255,0.75)",
                borderLeft: isActive(link.href) ? "3px solid var(--blue)" : "3px solid transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
