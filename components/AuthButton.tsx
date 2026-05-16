"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === "loading") {
    return <div style={{ width: 32, height: 32 }} />;
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition"
        style={{ background: "white", color: "var(--dark)", border: "1px solid #E5E7EB", fontWeight: 600 }}
      >
        <span>👤</span> Войти
      </button>
    );
  }

  const initial = (session.user.name || session.user.email || "?")[0].toUpperCase();
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(o => !o)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition overflow-hidden"
        style={{ background: "rgba(255,255,255,0.12)", color: "white", fontWeight: 700, fontSize: 14, border: "1px solid rgba(255,255,255,0.2)" }}
        title={session.user.email || ""}
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={initial} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {menuOpen && (
        <div
          onMouseLeave={() => setMenuOpen(false)}
          className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg py-1 z-50"
          style={{ border: "1px solid #E5E7EB", minWidth: 200 }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b" style={{ borderColor: "#F3F4F6" }}>
            {session.user.email}
          </div>
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-gray-50"
            style={{ color: "var(--dark)" }}
          >
            👤 Мой профиль
          </Link>
          <Link
            href="/profile#trips"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-gray-50"
            style={{ color: "var(--dark)" }}
          >
            🗺 Мои поездки
          </Link>
          <button
            onClick={() => { setMenuOpen(false); signOut(); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            style={{ color: "#DC2626" }}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
