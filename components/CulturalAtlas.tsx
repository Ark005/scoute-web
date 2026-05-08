import Link from "next/link";

type Figure = {
  key: string;
  name: string;
  years: string;
  role: string;
  story: string;
  place: { label: string; href: string };
};

const FIGURES: Figure[] = [
  {
    key: "pirosmani",
    name: "Нико Пиросмани",
    years: "1862—1918",
    role: "примитивист",
    story:
      "Писал на чёрной клеёнке, расплачивался картинами за еду. Умер в нищете. Через год назвали гением. Ходят легенды что засыпал двор французской актрисы цветами — её Пугачёва пела.",
    place: { label: "Тбилиси, духаны старого города", href: "/cities/tbilisi" },
  },
  {
    key: "gabriadze",
    name: "Резо Габриадзе",
    years: "1936—2021",
    role: "сценарист, художник",
    story:
      "Написал «Мимино» и «Кин-дза-дза!». Сам расписал каждый изразец на своей часовой башне в старом Тбилиси — каждый час оттуда выходит ангел. Девиз: «Пусть слёзы у нас будут только от резки лука».",
    place: { label: "Театр марионеток, Тбилиси", href: "/cities/tbilisi" },
  },
  {
    key: "paradjanov",
    name: "Сергей Параджанов",
    years: "1924—1990",
    role: "режиссёр",
    story:
      "Родился в армянской семье в Тбилиси. «Цвет граната», «Легенда о Сурамской крепости». Феллини и Тарковский называли гением. Сидел дважды в советских лагерях за то что был собой.",
    place: { label: "Ул. Параджанова, 7", href: "/cities/tbilisi" },
  },
  {
    key: "rustaveli",
    name: "Шота Руставели",
    years: "XII век",
    role: "поэт",
    story:
      "«Витязь в тигровой шкуре» — грузинская Библия. Дарят молодожёнам, цитируют на свадьбах и похоронах 800 лет спустя. Главный проспект столицы — его имени.",
    place: { label: "Проспект Руставели, Тбилиси", href: "/cities/tbilisi" },
  },
  {
    key: "nino",
    name: "Святая Нино",
    years: "IV век",
    role: "крестительница Грузии",
    story:
      "Каппадокийка, пришла в Иверию ~320 г. с виноградным крестом, перевязанным её собственными волосами. За 14 лет обратила царя Мириана и страну. Грузия приняла христианство на 60 лет раньше Рима — сделала это одна женщина.",
    place: { label: "Бодбе, Кахетия", href: "/cities/sighnaghi" },
  },
  {
    key: "kikabidze",
    name: "Вахтанг Кикабидзе",
    years: "1938—2023",
    role: "актёр, певец",
    story:
      "Голос «Мимино». Лицо советской Грузии для всего русскоязычного мира. После 2008-го отказался от российских наград и концертов в РФ — принципиальная позиция, важный штрих.",
    place: { label: "Сигнахи (натура «Мимино»)", href: "/cities/sighnaghi" },
  },
  {
    key: "tabidze",
    name: "Галактион Табидзе",
    years: "1892—1959",
    role: "поэт",
    story:
      "«Сердце грузинской поэзии XX века». Его жена — мать Булата Окуджавы. В 2000-м церковь сняла с него грех самоубийства — беспрецедентно.",
    place: { label: "Тбилиси", href: "/cities/tbilisi" },
  },
  {
    key: "david",
    name: "Давид IV Строитель",
    years: "1073—1125",
    role: "царь",
    story:
      "Объединил Грузию, разгромил сельджуков, построил Гелати. Просил похоронить себя у входа в монастырь чтобы каждый прихожанин наступал на его могилу — как символ смирения царя перед верой.",
    place: { label: "Гелатский монастырь, Кутаиси", href: "/cities/kutaisi" },
  },
];

export default function CulturalAtlas() {
  return (
    <section className="max-w-screen-xl mx-auto px-4 mt-16 mb-12">
      <div className="mb-8 max-w-2xl">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
          Культура
        </div>
        <h2
          className="font-extrabold leading-tight mb-3"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: "clamp(28px, 4vw, 44px)",
            color: "var(--dark)",
          }}
        >
          Грузия — это её люди
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Маршрут — не только километры. Эти имена связаны с конкретными
          местами. Стоя на их улице, заходя в их собор, садясь в их духан —
          легче понять что вообще происходит вокруг.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FIGURES.map((f) => (
          <article
            key={f.key}
            className="rounded-2xl overflow-hidden flex transition hover:shadow-lg"
            style={{ background: "white", border: "1px solid #E5E7EB" }}
          >
            <div className="shrink-0 w-32 sm:w-40 relative" style={{ background: "#FAFAF7" }}>
              <img
                src={`/culture/${f.key}.png`}
                alt={f.name}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ minHeight: 220 }}
              />
            </div>
            <div className="flex-1 p-5 min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3
                  className="font-extrabold leading-tight"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 20,
                    color: "var(--dark)",
                  }}
                >
                  {f.name}
                </h3>
                <div className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {f.years}
                </div>
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                {f.role}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {f.story}
              </p>
              <Link
                href={f.place.href}
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:gap-2.5"
                style={{ color: "var(--blue)" }}
              >
                ↗ {f.place.label}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
