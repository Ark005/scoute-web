"use client";

import { useState } from "react";
import { thumbUrl } from "@/lib/thumb";

/**
 * Картинка с graceful-фолбэком. Если фото битое (404, фейковый Wikimedia URL,
 * пустой src) — рендерит `fallback` вместо «сломанной» иконки браузера.
 * Прокси через thumbUrl() — абсолютизирует относительные /media/... и
 * ресайзит через wsrv.nl. Использовать вместо сырого <img>/<Image> там,
 * где фото может не существовать.
 */
export default function SafeImg({
  src,
  alt,
  className,
  w,
  h,
  q = 75,
  fit = "cover",
  fallback = null,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  w?: number;
  h?: number;
  q?: number;
  fit?: "cover" | "contain";
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbUrl(src, { w, h, q, fit })}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
