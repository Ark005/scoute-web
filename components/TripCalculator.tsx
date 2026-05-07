"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { CityBudget } from "@/lib/types";

type Level = "budget" | "mid" | "premium";
type TravelMode = "flight" | "car" | "none";
type Currency = "USD" | "RUB" | "GEL";

const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", RUB: "₽", GEL: "₾" };
const CURRENCY_RATES: Record<Currency, number> = { USD: 1, RUB: 92, GEL: 2.7 };

const ORIGINS = [
  { code: "MOW", name: "Москва" }, { code: "LED", name: "Санкт-Петербург" },
  { code: "KZN", name: "Казань" }, { code: "SVX", name: "Екатеринбург" },
  { code: "OVB", name: "Новосибирск" }, { code: "ROV", name: "Ростов-на-Дону" },
  { code: "KRR", name: "Краснодар" }, { code: "AER", name: "Сочи" },
  { code: "UFA", name: "Уфа" }, { code: "MRV", name: "Минеральные Воды" },
  { code: "TLV", name: "Тель-Авив" }, { code: "IST", name: "Стамбул" },
  { code: "DXB", name: "Дубай" }, { code: "EVN", name: "Ереван" },
  { code: "GYD", name: "Баку" }, { code: "BER", name: "Берлин" },
  { code: "WAW", name: "Варшава" }, { code: "PRG", name: "Прага" },
  { code: "BEG", name: "Белград" }, { code: "ATH", name: "Афины" },
];

const COUNTRIES: { flag: string; name: string; nameIn: string; slugs: string[] }[] = [
  { flag: "\u{1F1EC}\u{1F1EA}", name: "Грузия", nameIn: "Грузию", slugs: ["tbilisi", "batumi", "kutaisi", "kazbegi", "borjomi", "mtskheta", "sighnaghi", "telavi", "gori", "mestia"] },
  { flag: "\u{1F1F9}\u{1F1F7}", name: "Турция", nameIn: "Турцию", slugs: ["istanbul", "cappadocia"] },
  { flag: "\u{1F1EE}\u{1F1F1}", name: "Израиль", nameIn: "Израиль", slugs: ["jerusalem", "tel-aviv", "galilee"] },
  { flag: "\u{1F1F7}\u{1F1FA}", name: "Россия", nameIn: "Россию", slugs: ["moscow", "saint-petersburg", "kazan", "sochi"] },
  { flag: "\u{1F1E6}\u{1F1F2}", name: "Армения", nameIn: "Армению", slugs: ["yerevan"] },
  { flag: "\u{1F1E6}\u{1F1FF}", name: "Азербайджан", nameIn: "Азербайджан", slugs: ["baku"] },
  { flag: "\u{1F1F7}\u{1F1F8}", name: "Сербия", nameIn: "Сербию", slugs: ["belgrade"] },
];

const TAGLINES: Record<string, string> = {
  tbilisi: "Живая история и современность", batumi: "Морской курорт с современным лицом",
  kutaisi: "Древняя столица Колхиды", kazbegi: "Горы, которые дышат вместе с тобой",
  borjomi: "Ущелье с самой знаменитой водой Грузии", mtskheta: "Древняя столица и святыни",
  sighnaghi: "Город влюбленных в Кахетии", telavi: "Сердце винного края",
  gori: "Крепость и пещерный город", mestia: "Сванские башни в облаках",
  istanbul: "Город на двух континентах", cappadocia: "Воздушные шары над скалами",
  jerusalem: "Три тысячи лет истории", "tel-aviv": "Средиземноморский драйв",
  galilee: "Святые места и природа", moscow: "Столица, которая никогда не спит",
  "saint-petersburg": "Культурная столица", kazan: "Где Европа встречает Азию",
  sochi: "Горы у моря", yerevan: "Город розового туфа",
  baku: "Огненная столица Каспия", belgrade: "Балканская энергия",
};

const DRIVE_DISTANCES: Record<string, { km: number; name: string }> = {
  MOW: { km: 2400, name: "Москва" }, LED: { km: 2900, name: "Санкт-Петербург" },
  KRR: { km: 1400, name: "Краснодар" }, ROV: { km: 1200, name: "Ростов-на-Дону" },
  MRV: { km: 700, name: "Минеральные Воды" }, SVX: { km: 3200, name: "Екатеринбург" },
  EVN: { km: 300, name: "Ереван" }, GYD: { km: 600, name: "Баку" }, IST: { km: 1700, name: "Стамбул" },
};

const HOTEL_LABELS: Record<Level, { i: string; l: string }> = {
  budget: { i: "\u{1F3E0}", l: "Хостел" }, mid: { i: "\u{1F3E8}", l: "Отель 3*" }, premium: { i: "\u2728", l: "4-5*" },
};

interface Leg { slug: string; days: number; hotelLevel: Level; expanded: boolean }
interface Props { budgets: CityBudget[] }

const hp = (v: any) => (typeof v === "number" ? v : v?.price ?? 0);
function fmt(usd: number, cur: Currency): string { return `${CURRENCY_SYMBOLS[cur]}${Math.round(usd * CURRENCY_RATES[cur]).toLocaleString()}`; }
function fmtU(usd: number, cur: Currency): string { return `${CURRENCY_SYMBOLS[cur]}${Math.round(usd * CURRENCY_RATES[cur])}`; }

export default function TripCalculator({ budgets }: Props) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [countryIdx, setCountryIdx] = useState(0);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [mealLevel, setMealLevel] = useState<Level>("mid");
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [travelMode, setTravelMode] = useState<TravelMode>("flight");
  const [originCode, setOriginCode] = useState("MOW");
  const [originSearch, setOriginSearch] = useState("");
  const [showOrigins, setShowOrigins] = useState(false);
  const [flightCost, setFlightCost] = useState(250);
  const [flightLoading, setFlightLoading] = useState(false);
  const [fuelBudget, setFuelBudget] = useState(150);
  const [carOrigin, setCarOrigin] = useState("MOW");
  const originRef = useRef<HTMLDivElement>(null);

  const availableCountries = useMemo(() => {
    const s = new Set(budgets.map((b) => b.slug));
    return COUNTRIES.filter((c) => c.slugs.some((sl) => s.has(sl)));
  }, [budgets]);
  const country = availableCountries[countryIdx] || availableCountries[0];
  const countryCities = useMemo(() => country ? budgets.filter((b) => country.slugs.includes(b.slug)) : [], [budgets, country]);

  // Init legs when country changes
  useEffect(() => {
    if (countryCities.length > 0) {
      setLegs([{ slug: countryCities[0].slug, days: 7, hotelLevel: "mid", expanded: false }]);
    }
  }, [countryIdx]); // eslint-disable-line

  useEffect(() => {
    const h = (e: MouseEvent) => { if (originRef.current && !originRef.current.contains(e.target as Node)) setShowOrigins(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Fetch flight price for first leg's city
  const firstSlug = legs[0]?.slug || "";
  useEffect(() => {
    if (travelMode !== "flight" || !firstSlug || !originCode) return;
    setFlightLoading(true);
    fetch(`https://scoute.app/api/flight-price/?origin=${originCode}&destination=${firstSlug}`)
      .then((r) => r.json()).then((d) => { if (d.price_usd) setFlightCost(Math.round(d.price_usd)); })
      .catch(() => {}).finally(() => setFlightLoading(false));
  }, [firstSlug, travelMode, originCode]);

  const originName = ORIGINS.find((o) => o.code === originCode)?.name || originCode;
  const filtered = useMemo(() => {
    if (!originSearch.trim()) return ORIGINS;
    const q = originSearch.toLowerCase();
    return ORIGINS.filter((o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q));
  }, [originSearch]);

  // Calculate per-leg and total
  const totalDays = legs.reduce((s, l) => s + l.days, 0);
  const legCalcs = legs.map((leg) => {
    const city = budgets.find((b) => b.slug === leg.slug);
    if (!city) return { hotel: 0, food: 0, transport: 0, subtotal: 0, cityName: leg.slug };
    const hotel = hp(city.hotel[leg.hotelLevel]) * leg.days;
    const food = hp(city.meal[mealLevel]) * mealsPerDay * leg.days * travelers;
    const transport = city.transport_daily * leg.days * travelers;
    return { hotel, food, transport, subtotal: hotel + food + transport, cityName: city.city };
  });
  const stayTotal = legCalcs.reduce((s, l) => s + l.subtotal, 0);
  let travelTotal = 0;
  if (travelMode === "flight") travelTotal = flightCost * travelers;
  if (travelMode === "car") travelTotal = fuelBudget;
  const grandTotal = stayTotal + travelTotal;
  const perDay = totalDays > 0 ? Math.round(grandTotal / totalDays) : 0;

  const updateLeg = (i: number, patch: Partial<Leg>) => setLegs((prev) => prev.map((l, j) => j === i ? { ...l, ...patch } : l));
  const removeLeg = (i: number) => setLegs((prev) => prev.length > 1 ? prev.filter((_, j) => j !== i) : prev);
  const addLeg = () => {
    const used = new Set(legs.map((l) => l.slug));
    const next = countryCities.find((c) => !used.has(c.slug)) || countryCities[0];
    if (next) setLegs((prev) => [...prev, { slug: next.slug, days: 3, hotelLevel: "mid", expanded: false }]);
  };

  if (!budgets.length) return <div className="p-8 text-center text-gray-400">Нет данных</div>;

  const barItems = [
    ...legCalcs.map((l) => ({ color: "#3B82F6", w: l.hotel })),
    { color: "#F59E0B", w: legCalcs.reduce((s, l) => s + l.food, 0) },
    { color: "#10B981", w: legCalcs.reduce((s, l) => s + l.transport, 0) },
    ...(travelTotal > 0 ? [{ color: "#8B5CF6", w: travelTotal }] : []),
  ].filter((i) => i.w > 0);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-5 pb-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-white mb-3">
            Калькулятор поездки{country ? ` в ${country.nameIn}` : ""}
          </h1>
          <div className="flex gap-2 mb-3 flex-wrap">
            {availableCountries.map((c, i) => (
              <button key={c.name} onClick={() => setCountryIdx(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${countryIdx === i ? "bg-white text-blue-700 shadow" : "bg-white/15 text-white hover:bg-white/25"}`}>
                <span className="text-base">{c.flag}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 space-y-4 pb-36">
        {/* Travelers + Currency */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Человек</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50">-</button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center">{travelers}</span>
              <button onClick={() => setTravelers(Math.min(10, travelers + 1))} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50">+</button>
            </div>
          </div>
          <div className="flex gap-1">
            {(["USD", "RUB", "GEL"] as Currency[]).map((c) => (
              <button key={c} onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currency === c ? "bg-blue-50 border border-blue-300 text-blue-800" : "border border-gray-100 text-gray-600 hover:bg-gray-50"}`}>
                {CURRENCY_SYMBOLS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* City legs */}
        {legs.map((leg, i) => {
          const city = budgets.find((b) => b.slug === leg.slug);
          const lc = legCalcs[i];
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Leg header: city + days + subtotal */}
              <div className="p-4 flex items-center gap-3">
                <select value={leg.slug} onChange={(e) => updateLeg(i, { slug: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 bg-white">
                  {countryCities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateLeg(i, { days: Math.max(1, leg.days - 1) })} className="w-7 h-7 rounded border border-gray-200 text-gray-500 flex items-center justify-center text-sm">-</button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">{leg.days}</span>
                  <button onClick={() => updateLeg(i, { days: leg.days + 1 })} className="w-7 h-7 rounded border border-gray-200 text-gray-500 flex items-center justify-center text-sm">+</button>
                  <span className="text-xs text-gray-400 ml-1">дн.</span>
                </div>
                <span className="text-sm font-bold text-gray-900 ml-2">{fmt(lc?.subtotal ?? 0, currency)}</span>
                <button onClick={() => updateLeg(i, { expanded: !leg.expanded })}
                  className="w-7 h-7 rounded border border-gray-200 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-50">
                  {leg.expanded ? "\u25B2" : "\u25BC"}
                </button>
                {legs.length > 1 && (
                  <button onClick={() => removeLeg(i)} className="w-7 h-7 rounded border border-gray-200 text-gray-400 flex items-center justify-center text-xs hover:bg-red-50 hover:text-red-500">\u00D7</button>
                )}
              </div>
              {/* Tagline */}
              {TAGLINES[leg.slug] && <p className="text-xs text-gray-400 px-4 -mt-2 mb-2 italic">{TAGLINES[leg.slug]}</p>}
              {/* Hotel level (always visible as compact row) */}
              <div className="px-4 pb-3 flex gap-1.5">
                {(["budget", "mid", "premium"] as Level[]).map((lv) => (
                  <button key={lv} onClick={() => updateLeg(i, { hotelLevel: lv })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition ${leg.hotelLevel === lv ? "bg-blue-50 border border-blue-300 text-blue-800" : "border border-gray-100 text-gray-600"}`}>
                    {HOTEL_LABELS[lv].i} {HOTEL_LABELS[lv].l} {fmtU(hp(city?.hotel[lv]), currency)}
                  </button>
                ))}
              </div>
              {/* Expanded details */}
              {leg.expanded && lc && (
                <div className="px-4 pb-3 space-y-1 text-xs text-gray-500 border-t border-gray-50 pt-2">
                  <div className="flex justify-between"><span>Жилье: {fmtU(hp(city?.hotel[leg.hotelLevel]), currency)}/н x {leg.days}</span><span className="font-semibold text-gray-700">{fmt(lc.hotel, currency)}</span></div>
                  <div className="flex justify-between"><span>Еда: {fmtU(hp(city?.meal[mealLevel]), currency)} x {mealsPerDay} x {leg.days}д x {travelers}ч</span><span className="font-semibold text-gray-700">{fmt(lc.food, currency)}</span></div>
                  <div className="flex justify-between"><span>Транспорт: {fmtU(city?.transport_daily ?? 0, currency)}/д x {leg.days}д x {travelers}ч</span><span className="font-semibold text-gray-700">{fmt(lc.transport, currency)}</span></div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addLeg} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition">
          + Добавить город
        </button>

        {/* Food (shared) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Еда <span className="text-gray-400">(на 1 чел.)</span></span>
            <div className="flex gap-1">
              {[2, 3, 4].map((n) => (
                <button key={n} onClick={() => setMealsPerDay(n)}
                  className={`w-6 h-6 rounded-md text-xs font-semibold transition ${mealsPerDay === n ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>{n}x</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {(["budget", "mid", "premium"] as Level[]).map((lv) => {
              const city0 = budgets.find((b) => b.slug === (legs[0]?.slug || ""));
              return (
                <button key={lv} onClick={() => setMealLevel(lv)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium text-center transition ${mealLevel === lv ? "bg-amber-50 border border-amber-300 text-amber-900" : "border border-gray-100 text-gray-600"}`}>
                  {lv === "budget" ? "\u{1F950} Стрит-фуд" : lv === "mid" ? "\u{1F37D}\u{FE0F} Кафе" : "\u{1F942} Ресторан"} {fmtU(hp(city0?.meal[lv]), currency)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Как добираться</div>
          <div className="flex gap-2 mb-3">
            {([
              { k: "flight" as TravelMode, l: "Самолет", i: "\u2708\uFE0F" },
              { k: "car" as TravelMode, l: "На авто", i: "\u{1F697}" },
              { k: "none" as TravelMode, l: "На месте", i: "\u{1F4CD}" },
            ]).map((m) => (
              <button key={m.k} onClick={() => setTravelMode(m.k)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-center transition ${travelMode === m.k ? "bg-indigo-50 border-2 border-indigo-400 text-indigo-800" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{m.i} {m.l}</button>
            ))}
          </div>
          {travelMode === "flight" && (
            <div className="grid grid-cols-2 gap-3">
              <div ref={originRef} className="relative">
                <label className="text-xs text-gray-500 mb-1 block">Откуда</label>
                <button onClick={() => setShowOrigins(!showOrigins)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-left text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                  <span>{originName}</span><span className="text-gray-400 text-xs">{originCode}</span>
                </button>
                {showOrigins && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-56 overflow-y-auto">
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                      <input type="text" value={originSearch} onChange={(e) => setOriginSearch(e.target.value)} placeholder="Поиск..." autoFocus
                        className="w-full px-3 py-1.5 rounded-md border border-gray-200 text-sm outline-none focus:border-blue-400" />
                    </div>
                    {filtered.length === 0 && <div className="px-3 py-4 text-center"><p className="text-sm text-red-500 font-medium">Выбор аэропорта не валиден</p></div>}
                    {filtered.map((o) => (
                      <button key={o.code} onClick={() => { setOriginCode(o.code); setOriginSearch(""); setShowOrigins(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between ${originCode === o.code ? "bg-blue-50 font-semibold" : ""}`}>
                        <span>{o.name}</span><span className="text-xs text-gray-400 font-mono">{o.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Перелет т/о, $/чел.</label>
                <input type="number" value={flightCost} onChange={(e) => setFlightCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-400" />
                {flightLoading && <p className="text-[10px] text-blue-500 mt-1 animate-pulse">Загрузка...</p>}
              </div>
            </div>
          )}
          {travelMode === "car" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Откуда</label>
                <select value={carOrigin} onChange={(e) => { setCarOrigin(e.target.value); const d = DRIVE_DISTANCES[e.target.value]; if (d) setFuelBudget(Math.round(d.km * 2 * 10 / 100 * 1.2)); }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none">
                  {Object.entries(DRIVE_DISTANCES).map(([code, d]) => <option key={code} value={code}>{d.name} (~{d.km} км)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Бензин т/о, $</label>
                <input type="number" value={fuelBudget} onChange={(e) => setFuelBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none" />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-sm">
          {grandTotal > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
              {barItems.map((it, i) => <div key={i} className="rounded-full" style={{ background: it.color, flex: it.w / grandTotal }} />)}
            </div>
          )}
          <div className="space-y-1.5">
            {legCalcs.map((lc, i) => (
              <div key={i} className="flex justify-between text-gray-700">
                <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />{lc.cityName} <span className="text-gray-400 text-xs">{legs[i].days}д</span></span>
                <span className="font-semibold">{fmt(lc.subtotal, currency)}</span>
              </div>
            ))}
            {travelTotal > 0 && (
              <div className="flex justify-between text-gray-700">
                <span><span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-2" />{travelMode === "flight" ? "Перелет" : "Бензин"}</span>
                <span className="font-semibold">{fmt(travelTotal, currency)}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-3">Примерные цены. Отель — за номер. Еда и транспорт — на каждого.</p>
        </div>
      </div>

      {/* Sticky total */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">
              {country?.flag} {legCalcs.map((l) => l.cityName).join(" → ")} &middot; {totalDays}д &middot; {travelers}ч
            </div>
            <div className="text-xs text-gray-400">~{fmt(perDay, currency)}/день</div>
          </div>
          <div className="text-3xl font-black text-gray-900 tracking-tight">{fmt(grandTotal, currency)}</div>
        </div>
      </div>
    </div>
  );
}
