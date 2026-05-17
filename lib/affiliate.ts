// Travelpayouts affiliate URL wrapping. Marker 521784 = scoute.app.
//
// Aviasales: marker= распознаётся самим aviasales.ru, атрибуция надёжная.
// Booking, Ostrovok, GetYourGuide и прочие: оставляем сырой URL —
// Travelpayouts Drive (скрипт в app/layout.tsx) сканирует DOM на проде
// и подменяет на emrld.ltd?erid=... в рантайме. Если Drive перестанет
// покрывать — оборачивать вручную через tp.media/r?marker=521784&p=...
// с правильным p= из кабинета.

const TP_MARKER = "521784";

const AVIASALES_HOSTS = ["aviasales.ru", "aviasales.com", "www.aviasales.ru", "www.aviasales.com"];

export function affiliateUrl(rawUrl: string, opts?: { subId?: string }): string {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  if (AVIASALES_HOSTS.includes(u.hostname)) {
    u.searchParams.set("marker", TP_MARKER);
    if (opts?.subId) {
      u.searchParams.set("sub_id", opts.subId);
    }
    return u.toString();
  }

  return rawUrl;
}
