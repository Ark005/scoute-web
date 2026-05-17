// Транспортные опции для каждого маршрута
// car_hours — примерное время на машине из Москвы (80 км/ч)
// flight_iata — код аэропорта назначения (Aviasales)
// train_city — название города для Туту.ру

import { affiliateUrl } from "./affiliate";

export interface TransportOption {
  car_km: number;
  car_hours: number;
  flight_iata?: string;
  flight_city?: string;
  train_city?: string;
  bus_available?: boolean;
  rental_country?: string;
}

// Москва: 55.7558, 37.6173
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const TRANSPORT_LOOKUP: Record<string, Partial<TransportOption>> = {
  // Ближнее Подмосковье — только авто
  "kolomna-weekend":        { train_city: "Коломна" },
  "serpukhov-tarusa":       { train_city: "Серпухов" },
  "pereslavl-zalessky":     { train_city: "Сергиев Посад" },
  "podmoskovye-usadby":     {},
  "moscow-ring-1day":       {},

  // Центральная Россия — авто + поезд
  "suzdal-vladimir-weekend": { train_city: "Владимир" },
  "golden-ring-3days":       { train_city: "Сергиев Посад" },
  "zolotoe-koltso":          { train_city: "Владимир" },
  "ryazan-esenin":           { train_city: "Рязань" },
  "tula-tolstoy":            { train_city: "Тула" },
  "tver-torzhok":            { train_city: "Тверь" },
  "smolensk-history":        { train_city: "Смоленск" },
  "voronezh-divnogorye":     { train_city: "Воронеж" },
  "yaroslavl-kostroma":      { train_city: "Ярославль" },
  "nizhny-novgorod-weekend": { train_city: "Нижний Новгород" },
  "kazan-weekend":           { train_city: "Казань" },

  // Северо-Запад
  "spb-vyborg":              { train_city: "Санкт-Петербург" },
  "pskov-izborsk":           { train_city: "Псков" },
  "karelia-weekend":         { train_city: "Петрозаводск", flight_iata: "PES", flight_city: "Петрозаводск" },
  "karelia-valaam":          { train_city: "Сортавала", flight_iata: "PES", flight_city: "Петрозаводск" },
  "karelia-ruskeala":        { train_city: "Петрозаводск", flight_iata: "PES", flight_city: "Петрозаводск" },

  // Юг России / Кавказ
  "sochi-krasnaya-polyana":  { train_city: "Сочи", flight_iata: "AER", flight_city: "Сочи" },
  "adygea-lagonaki":         { train_city: "Краснодар", flight_iata: "KRR", flight_city: "Краснодар" },
  "crimea-yalta-balaklava":  { flight_iata: "SIP", flight_city: "Симферополь" },
  "dagestan-mountains":      { flight_iata: "MCX", flight_city: "Махачкала" },
  "caucasus-7days":          { train_city: "Пятигорск", flight_iata: "MRV", flight_city: "Минеральные Воды" },
  "prielbrusye-kavkaz":      { train_city: "Нальчик", flight_iata: "NAL", flight_city: "Нальчик" },
  "ingushetia-towers":       { flight_iata: "IGT", flight_city: "Магас" },
  "north-ossetia-digoria":   { flight_iata: "OGZ", flight_city: "Владикавказ" },
  "abkhazia-gagra-sukhum":   { flight_iata: "AER", flight_city: "Сочи (граница 60 км)" },

  // Поволжье / Урал / Сибирь
  "samara-zhiguli":          { train_city: "Самара", flight_iata: "KUF", flight_city: "Самара" },
  "ufa-bashkiria":           { train_city: "Уфа", flight_iata: "UFA", flight_city: "Уфа" },
  "ekaterinburg-weekend":    { train_city: "Екатеринбург", flight_iata: "SVX", flight_city: "Екатеринбург" },
  "chelyabinsk-taganay":     { train_city: "Челябинск", flight_iata: "CEK", flight_city: "Челябинск" },
  "tobolsk-tyumen":          { train_city: "Тюмень", flight_iata: "TJM", flight_city: "Тюмень" },
  "chuysky-trakt-altay":     { flight_iata: "OVB", flight_city: "Новосибирск" },
  "altai-6days":             { flight_iata: "OVB", flight_city: "Новосибирск" },
  "baikal-7days":            { flight_iata: "IKT", flight_city: "Иркутск" },
  "baikal-listvyanka":       { flight_iata: "IKT", flight_city: "Иркутск" },

  // СНГ
  "belarus-zamki-kreposti":  { train_city: "Минск", flight_iata: "MSQ", flight_city: "Минск" },
  "georgia-5days":           { flight_iata: "TBS", flight_city: "Тбилиси", rental_country: "georgia" },
  "georgia-historical":      { flight_iata: "TBS", flight_city: "Тбилиси", rental_country: "georgia" },
  "georgia-full-ring":       { flight_iata: "TBS", flight_city: "Тбилиси", rental_country: "georgia" },
  "georgia-kazbegi":         { flight_iata: "TBS", flight_city: "Тбилиси", rental_country: "georgia" },
  "georgia-wine-kakheti":    { flight_iata: "TBS", flight_city: "Тбилиси", rental_country: "georgia" },
  "georgia-khevsureti-trek": { flight_iata: "TBS", flight_city: "Тбилиси", rental_country: "georgia" },
  "georgia-batumi-beach":    { flight_iata: "BUS", flight_city: "Батуми", rental_country: "georgia" },
  "georgia-svaneti":         { flight_iata: "KUT", flight_city: "Кутаиси", rental_country: "georgia" },
  "georgia-racha":           { flight_iata: "KUT", flight_city: "Кутаиси", rental_country: "georgia" },
  "armenia-yerevan-garni":   { flight_iata: "EVN", flight_city: "Ереван", rental_country: "armenia" },

  // Европа
  "grossglockner-austria":   { flight_iata: "SZG", flight_city: "Зальцбург" },
  "romantische-strasse-germany": { flight_iata: "NUE", flight_city: "Нюрнберг" },
  "loire-chateaux-france":   { flight_iata: "ORY", flight_city: "Париж" },
  "tuscany-siena":           { flight_iata: "FLR", flight_city: "Флоренция" },
  "spain-costa-brava":       { flight_iata: "GRO", flight_city: "Жирона" },
  "poland-krakow-tatra":     { flight_iata: "KRK", flight_city: "Краков" },
  "norway-fjords-bergen":    { flight_iata: "BGO", flight_city: "Берген" },

  // Турция
  "turkey-cappadocia":       { flight_iata: "ASR", flight_city: "Кайсери" },
};

export function getTransport(slug: string, startLat: number, startLng: number): TransportOption {
  const lookup = TRANSPORT_LOOKUP[slug] ?? {};
  const car_km = haversine(55.7558, 37.6173, startLat, startLng);
  const car_hours = Math.round(car_km / 80);
  return { car_km, car_hours, ...lookup };
}

function ddmm(iso?: string | null, fallbackDaysAhead = 30): string {
  let d: Date;
  if (iso) {
    d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) {
      d = new Date();
      d.setDate(d.getDate() + fallbackDaysAhead);
    }
  } else {
    d = new Date();
    d.setDate(d.getDate() + fallbackDaysAhead);
  }
  return String(d.getDate()).padStart(2, "0") + String(d.getMonth() + 1).padStart(2, "0");
}

export function aviasalesUrl(iata: string, dateFrom?: string | null, dateTo?: string | null): string {
  // Aviasales URL: /search/MOW{DDMM}{IATA}{DDMM_back}1
  // Если дат нет — даём только туда +30 дней (как было).
  const out = ddmm(dateFrom, 30);
  const back = dateTo ? ddmm(dateTo, 37) : "";
  return affiliateUrl(`https://www.aviasales.ru/search/MOW${out}${iata}${back}1`, { subId: iata });
}

export function tutuUrl(city: string): string {
  return `https://www.tutu.ru/poezda/wizard/?st1=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&st2=${encodeURIComponent(city)}&direction=from`;
}

// Город назначения → IATA для прилёта (Aviasales). Если city отсутствует
// в карте — фолбэк по стране (TBS для Грузии).
const CITY_TO_IATA: Record<string, string> = {
  tbilisi: "TBS",
  batumi: "BUS",
  kutaisi: "KUT",
  mestia: "KUT",
  gudauri: "TBS",
  bakuriani: "TBS",
  borjomi: "TBS",
  kazbegi: "TBS",
  sighnaghi: "TBS",
  telavi: "TBS",
  mtskheta: "TBS",
  gori: "TBS",
};

const COUNTRY_TO_IATA: Record<string, string> = {
  georgia: "TBS",
  armenia: "EVN",
  belarus: "MSQ",
};

export function destinationIata(citySlug?: string | null, countrySlug?: string | null): string | null {
  if (citySlug && CITY_TO_IATA[citySlug]) return CITY_TO_IATA[citySlug];
  if (countrySlug && COUNTRY_TO_IATA[countrySlug]) return COUNTRY_TO_IATA[countrySlug];
  return null;
}

// Маппинг страны → код Localrent. Если страны нет — null (кнопку не показываем).
const COUNTRY_TO_LOCALRENT: Record<string, string> = {
  georgia: "georgia",
  armenia: "armenia",
};

export function localrentCountry(countrySlug?: string | null): string | null {
  if (!countrySlug) return null;
  return COUNTRY_TO_LOCALRENT[countrySlug] || null;
}

export interface LocalrentOpts {
  pickupCity?: string;
  returnCity?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export function localrentUrl(country: string, opts?: LocalrentOpts): string {
  const params = new URLSearchParams();
  if (opts?.pickupCity) params.set("pickup_city", opts.pickupCity);
  if (opts?.returnCity) params.set("return_city", opts.returnCity);
  if (opts?.dateFrom) params.set("pickup_date", opts.dateFrom);
  if (opts?.dateTo) params.set("return_date", opts.dateTo);
  const qs = params.toString();
  return `https://www.localrent.com/${country}${qs ? `?${qs}` : ""}`;
}

// Поиск отелей на Ostrovok.ru. Сырая ссылка — Travelpayouts Drive
// (скрипт в app/layout.tsx) перепишет домен на emrld.ltd?erid=...
// в рантайме. cityName — русское/английское имя как в CITIES.name.
// Ostrovok закрыл /hotel/search/?q=... (404), работает /hotel/<country>/<city-slug>/.
const OSTROVOK_SLUGS: Record<string, string> = {
  "тбилиси": "georgia/tbilisi", "tbilisi": "georgia/tbilisi",
  "батуми": "georgia/batumi", "batumi": "georgia/batumi",
  "кутаиси": "georgia/kutaisi", "kutaisi": "georgia/kutaisi",
  "гудаури": "georgia/gudauri", "gudauri": "georgia/gudauri",
  "бакуриани": "georgia/bakuriani", "bakuriani": "georgia/bakuriani",
  "боржоми": "georgia/borjomi", "borjomi": "georgia/borjomi",
  "местиа": "georgia/mestia", "местия": "georgia/mestia", "mestia": "georgia/mestia",
  "сигнахи": "georgia/sighnaghi", "sighnaghi": "georgia/sighnaghi",
  "степанцминда": "georgia/kazbegi", "казбеги": "georgia/kazbegi",
  "stepantsminda": "georgia/kazbegi", "kazbegi": "georgia/kazbegi",
  "зугдиди": "georgia/zugdidi", "zugdidi": "georgia/zugdidi",
  "ахалцихе": "georgia/akhaltsikhe", "akhaltsikhe": "georgia/akhaltsikhe",
  "поти": "georgia/poti", "poti": "georgia/poti",
  "телави": "georgia/telavi", "telavi": "georgia/telavi",
  "рустави": "georgia/rustavi", "rustavi": "georgia/rustavi",
};

export function ostrovokUrl(cityName: string, dateFrom?: string | null, dateTo?: string | null): string {
  const slug = OSTROVOK_SLUGS[cityName.toLowerCase().trim()];
  const params = new URLSearchParams();
  if (dateFrom) params.set("checkin", dateFrom);
  if (dateTo) params.set("checkout", dateTo);
  const qs = params.toString();
  if (slug) return `https://ostrovok.ru/hotel/${slug}/${qs ? `?${qs}` : ""}`;
  return `https://ostrovok.ru/?q=${encodeURIComponent(cityName)}${qs ? `&${qs}` : ""}`;
}
