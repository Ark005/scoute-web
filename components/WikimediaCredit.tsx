/**
 * Атрибуция Wikimedia Commons — лицензия CC BY-SA требует указать автора и
 * ссылку на источник. Точные имена авторов не у нас — мы храним только URL,
 * поэтому даём ссылку на страницу файла, где Wikimedia показывает автора +
 * лицензию.
 *
 * Использовать рядом с любым `<img>` чей src содержит `upload.wikimedia.org`
 * или `commons.wikimedia.org`.
 */
type Props = {
  /** Прямой URL картинки (`upload.wikimedia.org/wikipedia/commons/.../<filename>.jpg`) */
  imageUrl: string;
  className?: string;
};

function isWikimedia(url: string): boolean {
  return /(upload|commons)\.wikimedia\.org/.test(url);
}

/**
 * Превращает прямой URL upload.wikimedia в ссылку на страницу файла:
 *   upload.wikimedia.org/wikipedia/commons/3/3b/Sighnaghi.jpg
 *   →  https://commons.wikimedia.org/wiki/File:Sighnaghi.jpg
 */
function fileDescriptionUrl(imageUrl: string): string {
  try {
    const u = new URL(imageUrl);
    const segments = u.pathname.split("/").filter(Boolean);
    let filename = segments[segments.length - 1];
    // Thumb-paths: /wikipedia/commons/thumb/3/3b/Sighnaghi.jpg/640px-Sighnaghi.jpg
    // → берём предпоследний сегмент (оригинальное имя файла).
    if (segments.includes("thumb") && /^\d+px-/.test(filename)) {
      filename = segments[segments.length - 2];
    }
    return `https://commons.wikimedia.org/wiki/File:${decodeURIComponent(filename)}`;
  } catch {
    return imageUrl;
  }
}

export default function WikimediaCredit({ imageUrl, className }: Props) {
  if (!imageUrl || !isWikimedia(imageUrl)) return null;
  return (
    <a
      href={fileDescriptionUrl(imageUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "text-[9px] leading-tight underline-offset-2 hover:underline " +
        (className || "")
      }
      style={{ color: "rgba(255,255,255,0.7)" }}
      title="Источник: Wikimedia Commons. Автор и лицензия — на странице файла."
    >
      © Wikimedia
    </a>
  );
}
