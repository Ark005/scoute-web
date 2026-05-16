"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "scoute_cookies_acknowledged_v1";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const ack = window.localStorage.getItem(STORAGE_KEY);
      if (!ack) setShow(true);
    } catch { /* SSR-safe */ }
  }, []);

  if (!show) return null;

  const handleAck = () => {
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Уведомление о cookies"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 480,
        marginLeft: "auto",
        marginRight: "auto",
        background: "white",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        border: "1px solid #E5E7EB",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        color: "var(--dark)",
      }}
    >
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        Используем cookies для работы интерфейса. Подробнее в{" "}
        <Link href="/privacy" style={{ color: "var(--blue)", textDecoration: "underline" }}>
          политике конфиденциальности
        </Link>
        .
      </span>
      <button
        onClick={handleAck}
        style={{
          background: "var(--blue)",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Понятно
      </button>
    </div>
  );
}
