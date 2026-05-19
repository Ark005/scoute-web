// Image proxy через wsrv.nl (Cloudflare-backed, бесплатно, без ключа).
// Кеширует ресайзнутый WebP на CF — оригиналы /media/cached_images/ часто
// 1-3 МБ Wikimedia, прокси отдаёт ~50-150 КБ thumbnails.
//
// ИСКЛЮЧЕНИЕ — upload.wikimedia.org: wsrv.nl ловит от Викимедии 429
// (shared-прокси зарейтлимичен). Прямые wikimedia-фото отдаём через
// родной thumbnail Викимедии. Викимедия принимает только bucket-ширины
// (320/640/800 → 400), а 960px генерируется по запросу — используем его.

const PROXY = "https://wsrv.nl/?url=";
const WIKIMEDIA_HOST = "upload.wikimedia.org";
const WIKIMEDIA_BUCKET = 960;

function absolute(u: string): string {
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `https://scoute.app${u}`;
  return `https://scoute.app/${u}`;
}

// Сырая ссылка Викимедии .../wikipedia/<repo>/<a>/<ab>/<file>
// → родной thumbnail .../wikipedia/<repo>/thumb/<a>/<ab>/<file>/960px-<file>
function wikimediaThumb(u: string): string {
  if (u.includes("/thumb/")) return u; // уже thumbnail
  const m = u.match(
    /^(https?:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/i,
  );
  if (!m) return u;
  const [, base, a, ab, file] = m;
  // SVG масштабируется браузером сам — отдаём оригинал (thumb для svg = .png)
  if (/\.svgz?$/i.test(file)) return u;
  return `${base}/thumb/${a}/${ab}/${file}/${WIKIMEDIA_BUCKET}px-${file}`;
}

export function thumbUrl(
  src: string | null | undefined,
  opts: { w?: number; h?: number; q?: number; fit?: "cover" | "contain" } = {},
): string {
  if (!src) return "";
  // wsrv.nl не умеет проксировать локалхост / file: — отдаём как есть
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  const abs = absolute(src);
  // Wikimedia мимо wsrv — родной thumbnail (см. шапку файла)
  if (abs.includes(WIKIMEDIA_HOST)) return wikimediaThumb(abs);
  const params: string[] = [];
  if (opts.w) params.push(`w=${opts.w}`);
  if (opts.h) params.push(`h=${opts.h}`);
  params.push(`q=${opts.q ?? 80}`);
  params.push("output=webp");
  if (opts.fit === "cover") params.push("fit=cover", "a=attention");
  if (opts.fit === "contain") params.push("fit=contain");
  return `${PROXY}${encodeURIComponent(abs)}&${params.join("&")}`;
}
