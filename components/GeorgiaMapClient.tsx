"use client";

import dynamic from "next/dynamic";

const GeorgiaMap = dynamic(() => import("./GeorgiaMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "min(70vh, 560px)", minHeight: 360, background: "#F1ECDF" }}
      className="w-full flex items-center justify-center text-gray-400 text-sm"
    >
      Загружаем карту…
    </div>
  ),
});

export default function GeorgiaMapClient() {
  return <GeorgiaMap />;
}
