// Транспортные опции для каждого маршрута
// car_hours — примерное время на машине из Москвы (80 км/ч)
// flight_iata — код аэропорта назначения (Aviasales)
// train_city — название города для Туту.ру

export interface TransportOption {
  car_km: number;
  car_hours: number;
  flight_iata?: string;
  flight_city?: string;
  train_city?: string;
  bus_available?: boolean;
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
  "georgia-5days":           { flight_iata: "TBS", flight_city: "Тбилиси" },
  "armenia-yerevan-garni":   { flight_iata: "EVN", flight_city: "Ереван" },

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

export function aviasalesUrl(iata: string): string {
  // Ближайшие даты +30 дней
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `https://www.aviasales.ru/search/MOW${dd}${mm}${iata}1`;
}

export function tutuUrl(city: string): string {
  return `https://www.tutu.ru/poezda/wizard/?st1=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&st2=${encodeURIComponent(city)}&direction=from`;
}
