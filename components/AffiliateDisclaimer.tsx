/**
 * Маркировка партнёрских ссылок по 18-ФЗ ст.18.1.
 *
 * Используется рядом с любой кнопкой/ссылкой, содержащей affiliate marker
 * Travelpayouts (marker=521784) или другую партнёрскую программу с
 * вознаграждением.
 *
 * erid: токен ЕРИР, выдаётся через Travelpayouts dashboard.
 * Если erid пустой — маркировка частичная (рекламораспространитель + ИНН).
 * Травелпейаутс — оператор, регистрирует креативы за партнёров.
 */
type Props = {
  /** Полный erid-токен, который Travelpayouts выдал под нашу площадку. */
  erid?: string;
  /** Стилизация: компактная для маленьких кнопок, полная для крупных CTA. */
  variant?: "compact" | "full";
  /** Цвет текста — настраивается под фон. */
  color?: string;
};

const ADVERTISER_INN = "9909520797";
const ADVERTISER_NAME = "Go Travel Un Limited";

export default function AffiliateDisclaimer({
  erid,
  variant = "full",
  color = "#9CA3AF",
}: Props) {
  const text =
    variant === "full"
      ? `Реклама. ${ADVERTISER_NAME}, ИНН: ${ADVERTISER_INN}${erid ? `, erid: ${erid}` : ""}`
      : `Реклама. ${ADVERTISER_NAME}${erid ? `. erid: ${erid}` : ""}`;
  return (
    <div
      className="text-[10px] leading-tight mt-1.5"
      style={{ color }}
      title={`Реклама. ${ADVERTISER_NAME}, ИНН: ${ADVERTISER_INN}${erid ? `, erid: ${erid}` : ""}`}
    >
      {text}
    </div>
  );
}
