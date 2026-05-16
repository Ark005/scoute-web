"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

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
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <GeorgiaMap />
      ) : (
        <div
          style={{ height: "min(70vh, 560px)", minHeight: 360, background: "#F1ECDF" }}
          className="w-full flex items-center justify-center text-gray-400 text-sm"
        >
          Карта подгрузится при прокрутке
        </div>
      )}
    </div>
  );
}
