"use client";

import { useEffect } from "react";
import SafeImg from "@/components/SafeImg";

// Деталь точки доски. Точки авторского маршрута самодостаточны (своё
// описание + совет), отдельной POI-страницы у них нет — показываем модалкой.
type DetailSlot = {
  type?: string;
  name?: string;
  time?: string;
  duration_min?: number;
  description?: string;
  tip?: string;
  image_url?: string;
  is_event?: boolean;
  event_date?: string;
  ticket_url?: string;
};

export default function SlotDetailModal({
  slot,
  onClose,
}: {
  slot: DetailSlot;
  onClose: () => void;
}) {
  // Закрытие по Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {slot.image_url && (
          <SafeImg
            src={slot.image_url}
            alt={slot.name || ""}
            w={1024}
            h={440}
            fit="cover"
            className="w-full h-52 object-cover rounded-t-2xl"
            fallback={<div className="w-full h-52 bg-gray-100 rounded-t-2xl" />}
          />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-extrabold leading-tight" style={{ color: "var(--dark)" }}>
              {slot.name || "Точка маршрута"}
            </h3>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="text-gray-400 hover:text-gray-700 text-3xl leading-none -mt-1 shrink-0"
            >
              ×
            </button>
          </div>

          {(slot.time || slot.duration_min) && (
            <div className="text-sm text-gray-500 mt-1">
              {slot.time && <span className="font-mono">{slot.time}</span>}
              {slot.duration_min ? <span> · {slot.duration_min} мин</span> : null}
            </div>
          )}

          {slot.description && (
            <p className="text-sm leading-relaxed text-gray-700 mt-3 whitespace-pre-line">
              {slot.description}
            </p>
          )}

          {slot.tip && (
            <p
              className="text-sm leading-relaxed mt-3 rounded-lg px-3 py-2"
              style={{ background: "#FFFBEB", color: "#92400E" }}
            >
              💡 {slot.tip}
            </p>
          )}

          {slot.is_event && slot.ticket_url && (
            <a
              href={slot.ticket_url}
              target="_blank"
              rel="noopener sponsored"
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "#F97316" }}
            >
              🎫 Купить билет
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
