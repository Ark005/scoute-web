import AddToTripButton from "@/components/AddToTripButton";

type EventItem = {
  id: number;
  name: string;
  description: string;
  event_type: string;
  event_date: string | null;
  event_time: string | null;
  image_url: string;
  ticket_url: string;
};

type Props = {
  events: EventItem[];
  title?: string;
  subtitle?: string;
  dateFrom?: string | null; // ISO yyyy-mm-dd
  dateTo?: string | null;   // ISO yyyy-mm-dd
  limit?: number;
};

const TYPE_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  concert: { label: "Концерт", emoji: "🎵", color: "#7C3AED" },
  theatre: { label: "Театр", emoji: "🎭", color: "#DC2626" },
  festival: { label: "Фестиваль", emoji: "🎪", color: "#F59E0B" },
  exhibition: { label: "Выставка", emoji: "🖼", color: "#0EA5E9" },
  food: { label: "Гастро", emoji: "🍽", color: "#F97316" },
  other: { label: "Событие", emoji: "📅", color: "#64748B" },
};

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function formatDate(iso: string | null): { day: string; month: string; weekday: string } | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return {
    day: String(d.getDate()),
    month: MONTHS[d.getMonth()],
    weekday: WEEKDAYS[d.getDay()],
  };
}

export default function EventsCalendar({
  events,
  title,
  subtitle,
  dateFrom,
  dateTo,
  limit = 12,
}: Props) {
  if (!events || events.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const lowerBound = dateFrom || today;
  const upcoming = events
    .filter((e) => e.event_date && e.event_date >= lowerBound)
    .filter((e) => (dateTo ? (e.event_date as string) <= dateTo : true))
    .filter((e) => e.image_url)
    .slice(0, limit);

  if (upcoming.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-4 mt-12 mb-12">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
          Афиша
        </div>
        <h2
          className="font-extrabold leading-tight"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: "clamp(28px, 4vw, 44px)",
            color: "var(--dark)",
          }}
        >
          {title || "Что в Тбилиси на ближайшие дни"}
        </h2>
        <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
          {subtitle || "Концерты, спектакли, фестивали — собрано из allevents.in. Билет — у организаторов по ссылке."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcoming.map((e) => {
          const date = formatDate(e.event_date);
          const t = TYPE_LABEL[e.event_type] || TYPE_LABEL.other;
          return (
            <div
              key={e.id}
              className="group flex gap-3 rounded-2xl overflow-hidden bg-white transition hover:shadow-lg"
              style={{ border: "1px solid #E5E7EB" }}
            >
              {/* Date column */}
              {date && (
                <div
                  className="shrink-0 w-20 flex flex-col items-center justify-center text-center py-3"
                  style={{ background: t.color + "12", borderRight: "1px solid #E5E7EB" }}
                >
                  <div
                    className="font-extrabold leading-none"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 32,
                      color: t.color,
                    }}
                  >
                    {date.day}
                  </div>
                  <div
                    className="text-[11px] uppercase tracking-wider mt-0.5"
                    style={{ color: t.color }}
                  >
                    {date.month.slice(0, 3)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {date.weekday}
                  </div>
                </div>
              )}
              {/* Content */}
              <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: t.color }}
                  >
                    {t.emoji} {t.label}
                  </span>
                  {e.event_time && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      {e.event_time}
                    </span>
                  )}
                </div>
                <div
                  className="font-bold leading-tight mb-1 line-clamp-2"
                  style={{ color: "var(--dark)", fontSize: 14 }}
                >
                  {e.name}
                </div>
                {e.description && (
                  <div className="text-[11px] text-gray-500 line-clamp-2 mb-2">
                    {e.description}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1.5">
                  <AddToTripButton
                    item={{
                      kind: "event",
                      id: e.id,
                      name: e.name,
                      event_date: e.event_date,
                      event_time: e.event_time,
                      event_type: e.event_type,
                      image_url: e.image_url,
                      ticket_url: e.ticket_url,
                    }}
                  />
                  {e.ticket_url && (
                    <a
                      href={e.ticket_url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition hover:opacity-80"
                      style={{ background: "#F3F4F6", color: "var(--dark)" }}
                    >
                      Билеты ↗
                    </a>
                  )}
                </div>
              </div>
              {/* Image */}
              {e.image_url && (
                <div className="hidden sm:block shrink-0 w-24 bg-gray-100">
                  <img
                    src={e.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
