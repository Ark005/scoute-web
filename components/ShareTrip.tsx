"use client";

import { useEffect, useState } from "react";

type Props = {
  shareUrl: string;
  title: string;
};

export default function ShareTrip({ shareUrl, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // navigator.share есть только на клиенте (в основном мобайл) — определяем после монтирования,
  // чтобы не ловить рассинхрон гидратации.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const shareText = title ? `${title} — программа поездки в Scoute` : "Программа поездки в Scoute";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Старые браузеры / отказ в правах — fallback через скрытое поле.
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: shareText, text: shareText, url: shareUrl });
    } catch {
      // Пользователь закрыл системный шит — ничего не делаем.
    }
  }

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl,
  )}&text=${encodeURIComponent(shareText)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "#E5E7EB", background: "white" }}
    >
      <div className="font-semibold mb-1" style={{ color: "var(--dark)" }}>
        Поделиться программой
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Ссылка откроется в браузере и в приложении Scoute.
      </div>

      <div className="flex flex-wrap gap-2.5">
        {/* Скопировать — основное действие */}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
          style={{ background: copied ? "#10B981" : "var(--dark)" }}
        >
          {copied ? "✓ Ссылка скопирована" : "🔗 Скопировать ссылку"}
        </button>

        {/* Системный шит (мобайл) */}
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
            style={{ background: "#FF6B1B" }}
          >
            📤 Поделиться…
          </button>
        )}

        {/* Telegram */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
          style={{ background: "#0088CC" }}
        >
          ✈️ Telegram
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
          style={{ background: "#25D366" }}
        >
          💬 WhatsApp
        </a>
      </div>

      {/* Сама ссылка — клик по ней тоже копирует */}
      <button
        type="button"
        onClick={copyLink}
        title="Нажмите, чтобы скопировать"
        className="mt-4 w-full font-mono text-xs p-3 rounded-lg break-all text-left transition hover:bg-gray-100"
        style={{ background: "#F9FAFB", color: "var(--dark)" }}
      >
        {shareUrl}
      </button>
    </div>
  );
}
