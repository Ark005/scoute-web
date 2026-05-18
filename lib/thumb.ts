// Image proxy через wsrv.nl (Cloudflare-backed, бесплатно, без ключа).
// Кеширует ресайзнутый WebP на CF — оригиналы /media/cached_images/ часто
// 1-3 МБ Wikimedia, прокси отдаёт ~50-150 КБ thumbnails.
// Если когда-то будет thumbnail на нашем бэке — заменим реализацию.

const PROXY = "https://wsrv.nl/?url=";

function absolute(u: string): string {
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return `https://scoute.app/${u}`;
}

export function thumbUrl(
  src: string | null | undefined,
  opts: { w?: number; h?: number; q?: number; fit?: "cover" | "contain" } = {},
): string {
  if (!src) return "";
  // wsrv.nl не умеет проксировать локалхост / file: — отдаём как есть
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  const abs = absolute(src);
  const params: string[] = [];
  if (opts.w) params.push(`w=${opts.w}`);
  if (opts.h) params.push(`h=${opts.h}`);
  params.push(`q=${opts.q ?? 80}`);
  params.push("output=webp");
  if (opts.fit === "cover") params.push("fit=cover", "a=attention");
  if (opts.fit === "contain") params.push("fit=contain");
  return `${PROXY}${encodeURIComponent(abs)}&${params.join("&")}`;
}
