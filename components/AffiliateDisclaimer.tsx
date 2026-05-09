"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Маркировка партнёрских ссылок по 18-ФЗ ст.18.1.
 *
 * Travelpayouts выступает ОРД-посредником: их Drive-скрипт
 * (emrld.ltd/<base64-marker>.js) переписывает наши affiliate-ссылки
 * на проксирующий redirect emrld.ltd с динамически подставленным erid.
 *
 * Этот компонент после монтирования ищет ближайшую к себе ссылку
 * (родитель + соседи), вытаскивает erid из её href и показывает в
 * видимом тексте дисклеймера. Если Drive ещё не переписал — ставим
 * MutationObserver и обновляемся когда erid появится.
 *
 * При желании жёстко задать erid — передать prop `erid="..."`, тогда
 * автодетект отключается.
 */
type Props = {
  /** Если задан — рендерится этот erid и автодетект отключён. */
  erid?: string;
  /** Стилизация текста: full = «Реклама. <Юрлицо>, ИНН: <inn>, erid: <token>». */
  variant?: "compact" | "full";
  /** Цвет текста под фон. */
  color?: string;
};

const ADVERTISER_INN = "9909520797";
const ADVERTISER_NAME = "Go Travel Un Limited";

function findEridFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const m = href.match(/[?&]erid=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function findNearestErid(el: HTMLElement | null): string | null {
  if (!el) return null;
  // 1) Ближайший родитель — соседи.
  let scope: HTMLElement | null = el.parentElement;
  for (let depth = 0; depth < 3 && scope; depth++) {
    const links = scope.querySelectorAll<HTMLAnchorElement>(
      'a[href*="erid="], a[href*="emrld"], a[href*="tp.media"]',
    );
    for (const a of Array.from(links)) {
      const e = findEridFromHref(a.getAttribute("href"));
      if (e) return e;
    }
    scope = scope.parentElement;
  }
  return null;
}

export default function AffiliateDisclaimer({
  erid: eridProp,
  variant = "full",
  color = "#9CA3AF",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [autoErid, setAutoErid] = useState<string | null>(null);

  useEffect(() => {
    if (eridProp) return;
    if (!ref.current) return;

    const tryDetect = () => {
      const e = findNearestErid(ref.current);
      if (e) setAutoErid(e);
    };

    // Первый прогон — Drive мог уже отработать.
    tryDetect();
    // Повторы — на случай если Drive переписывает href после mount.
    const t1 = setTimeout(tryDetect, 250);
    const t2 = setTimeout(tryDetect, 1500);

    // MutationObserver на близкий контейнер — реагирует на href-изменения.
    let mo: MutationObserver | null = null;
    const watchScope = ref.current.parentElement?.parentElement || ref.current.parentElement;
    if (watchScope) {
      mo = new MutationObserver(() => tryDetect());
      mo.observe(watchScope, {
        attributes: true,
        attributeFilter: ["href"],
        subtree: true,
      });
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      mo?.disconnect();
    };
  }, [eridProp]);

  const erid = eridProp ?? autoErid;
  const text =
    variant === "full"
      ? `Реклама. ${ADVERTISER_NAME}, ИНН: ${ADVERTISER_INN}${erid ? `, erid: ${erid}` : ""}`
      : `Реклама. ${ADVERTISER_NAME}${erid ? `. erid: ${erid}` : ""}`;
  return (
    <div
      ref={ref}
      className="text-[10px] leading-tight mt-1.5"
      style={{ color }}
      title={`Реклама. ${ADVERTISER_NAME}, ИНН: ${ADVERTISER_INN}${erid ? `, erid: ${erid}` : ""}`}
    >
      {text}
    </div>
  );
}
