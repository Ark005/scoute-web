"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/routes", label: "Маршруты" },
  { href: "/autopilot", label: "Автопилот" },
  { href: "/cities", label: "Города" },
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
      <div className="max-w-screen-xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-white text-lg tracking-tight hover:opacity-90 transition"
        >
          Scout·E
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
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
