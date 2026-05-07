export interface CityEntry {
  name: string;
  slug: string;
  region: string;
  emoji: string;
  teaser: string;
  tags: string[];
  group: string;
}

export const CITIES: CityEntry[] = [
  { name: 'Москва', slug: 'moscow', region: 'Столица России', emoji: '🏙️', teaser: 'Красная площадь, Кремль, Третьяковка. AI-планировщик маршрутов.', tags: ['Планировщик', 'История', 'Культура'], group: 'russia' },
  { name: 'Санкт-Петербург', slug: 'saint-petersburg', region: 'Северная столица России', emoji: '🏛️', teaser: 'Эрмитаж, Петергоф, белые ночи, Спас на Крови.', tags: ['ЮНЕСКО', 'Культура', 'История'], group: 'russia' },
  { name: 'Коломна', slug: 'kolomna', region: 'Московская область', emoji: '🏰', teaser: 'Кремль, пастила, слияние рек. Лучший город выходного дня.', tags: ['История', 'Гастрономия'], group: 'russia' },
  { name: 'Владимир', slug: 'vladimir', region: 'Владимирская область', emoji: '🌟', teaser: 'Золотые ворота XII века, Успенский собор.', tags: ['ЮНЕСКО', 'История'], group: 'russia' },
  { name: 'Суздаль', slug: 'suzdal', region: 'Владимирская область', emoji: '⛪', teaser: '33 церкви, кремль XII века, медовуха.', tags: ['ЮНЕСКО', 'История'], group: 'russia' },
  { name: 'Ярославль', slug: 'yaroslavl', region: 'Ярославская область', emoji: '🌊', teaser: 'ЮНЕСКО — исторический центр. Набережная Волги 4 км.', tags: ['ЮНЕСКО', 'История'], group: 'russia' },
  { name: 'Казань', slug: 'kazan', region: 'Татарстан', emoji: '🕌', teaser: 'Третья столица России. Кремль с мечетью Кул-Шариф.', tags: ['ЮНЕСКО', 'История', 'Культура'], group: 'russia' },
  { name: 'Нижний Новгород', slug: 'nizhny-novgorod', region: 'Нижегородская область', emoji: '🌉', teaser: 'Кремль над Волгой, Чкаловская лестница.', tags: ['История', 'Архитектура'], group: 'russia' },
  { name: 'Тула', slug: 'tula', region: 'Тульская область', emoji: '🔫', teaser: 'Кремль, пряники, самовары. Ясная Поляна рядом.', tags: ['История', 'Культура'], group: 'russia' },
  { name: 'Великий Новгород', slug: 'veliky-novgorod', region: 'Новгородская область', emoji: '🛡️', teaser: 'Колыбель русской демократии. Детинец XII века.', tags: ['ЮНЕСКО', 'История'], group: 'russia' },
  { name: 'Псков', slug: 'pskov', region: 'Псковская область', emoji: '🏰', teaser: 'Псковский кром стоит 2000 лет. Изборск, Печоры.', tags: ['ЮНЕСКО', 'История'], group: 'russia' },
  { name: 'Алтай', slug: 'altai', region: 'Республика Алтай', emoji: '🏔️', teaser: 'Чуйский тракт — в топ-10 дорог мира. Телецкое озеро.', tags: ['Природа', 'Треккинг'], group: 'nature_ru' },
  { name: 'Байкал', slug: 'baikal', region: 'Иркутская область', emoji: '💧', teaser: 'Самое глубокое озеро планеты. Нерпы, лёд-витраж.', tags: ['Природа', 'Озеро'], group: 'nature_ru' },
  { name: 'Сочи', slug: 'sochi', region: 'Краснодарский край', emoji: '🏖️', teaser: 'Роза Хутор, Олимпийский парк. Горы и море рядом.', tags: ['Природа', 'Море'], group: 'nature_ru' },
  { name: 'Карелия', slug: 'karelia', region: 'Республика Карелия', emoji: '🌲', teaser: 'Кижи ЮНЕСКО, водопад Кивач. Тысячи озёр.', tags: ['ЮНЕСКО', 'Природа'], group: 'nature_ru' },
  { name: 'Тбилиси', slug: 'tbilisi', region: 'Грузия 🇬🇪', emoji: '🍷', teaser: 'Старый город, Нарикала, хинкали и вино.', tags: ['Культура', 'Гастрономия'], group: 'cis' },
  { name: 'Батуми', slug: 'batumi', region: 'Грузия 🇬🇪', emoji: '🌊', teaser: 'Черноморский курорт. Ботанический сад, набережная.', tags: ['Море', 'Природа'], group: 'cis' },
  { name: 'Ереван', slug: 'yerevan', region: 'Армения 🇦🇲', emoji: '🏛️', teaser: 'Розовый город. Каскад, Матенадаран, коньяк.', tags: ['История', 'Культура'], group: 'cis' },
  { name: 'Самарканд', slug: 'samarkand', region: 'Узбекистан 🇺🇿', emoji: '🕌', teaser: 'ЮНЕСКО. Регистан — главная площадь Средней Азии.', tags: ['ЮНЕСКО', 'История'], group: 'cis' },
  { name: 'Стамбул', slug: 'istanbul', region: 'Турция 🇹🇷', emoji: '🕌', teaser: 'Айя-София, Босфор, Гранд-Базар. Два континента.', tags: ['ЮНЕСКО', 'История', 'Культура'], group: 'europe' },
  { name: 'Прага', slug: 'prague', region: 'Чехия 🇨🇿', emoji: '🏰', teaser: 'Старый город, Карлов мост, ПражскийГрад.', tags: ['ЮНЕСКО', 'История', 'Архитектура'], group: 'europe' },
  { name: 'Вена', slug: 'vienna', region: 'Австрия 🇦🇹', emoji: '🎭', teaser: 'Хофбург, Бельведер, Шёнбрунн. Имперская столица.', tags: ['ЮНЕСКО', 'История', 'Культура'], group: 'europe' },
  { name: 'Будапешт', slug: 'budapest', region: 'Венгрия 🇭🇺', emoji: '🏰', teaser: 'Парламент у Дуная, купальни, рубиновое вино.', tags: ['ЮНЕСКО', 'История'], group: 'europe' },
  { name: 'Берлин', slug: 'berlin', region: 'Германия 🇩🇪', emoji: '🌆', teaser: 'Бранденбургские ворота, Рейхстаг, Музейный остров.', tags: ['История', 'Культура'], group: 'europe' },
  { name: 'Рим', slug: 'rome', region: 'Италия 🇮🇹', emoji: '🏛️', teaser: 'Колизей, Форум, Ватикан, фонтан Треви.', tags: ['ЮНЕСКО', 'История', 'Архитектура'], group: 'europe' },
  { name: 'Флоренция', slug: 'florence', region: 'Италия 🇮🇹', emoji: '🎨', teaser: 'Уффици, Давид, Дуомо. Родина Ренессанса.', tags: ['ЮНЕСКО', 'Искусство', 'История'], group: 'europe' },
  { name: 'Барселона', slug: 'barcelona', region: 'Испания 🇪🇸', emoji: '🏖️', teaser: 'Саграда Фамилия, Гауди, Ла Рамбла, пляжи.', tags: ['ЮНЕСКО', 'Архитектура', 'Море'], group: 'europe' },
  { name: 'Париж', slug: 'paris', region: 'Франция 🇫🇷', emoji: '🗼', teaser: 'Эйфелева башня, Лувр, Монмартр, Notre-Dame.', tags: ['ЮНЕСКО', 'Культура', 'Архитектура'], group: 'europe' },
  { name: 'Амстердам', slug: 'amsterdam', region: 'Нидерланды 🇳🇱', emoji: '🚲', teaser: 'Каналы, Рейксмузеум, тюльпаны, домики XVII века.', tags: ['История', 'Культура'], group: 'europe' },
  { name: 'Дубай', slug: 'dubai', region: 'ОАЭ 🇦🇪', emoji: '🌆', teaser: 'Бурдж-Халифа, Пальма, пустыня, шоппинг.', tags: ['Архитектура', 'Шопинг'], group: 'mideast' },
  { name: 'Иерусалим', slug: 'jerusalem', region: 'Израиль 🇮🇱', emoji: '✡️', teaser: 'Стена Плача, Гроб Господень, Купол Скалы.', tags: ['ЮНЕСКО', 'История', 'Религия'], group: 'mideast' },
  { name: 'Бангкок', slug: 'bangkok', region: 'Таиланд 🇹🇭', emoji: '🐘', teaser: 'Храмы, тук-туки, плавучие рынки, стрит-фуд.', tags: ['Культура', 'Гастрономия'], group: 'asia' },
  { name: 'Токио', slug: 'tokyo', region: 'Япония 🇯🇵', emoji: '🗼', teaser: 'Асакуса, Сибуя, Акихабара, суши с конвейера.', tags: ['Культура', 'Гастрономия'], group: 'asia' },
  { name: 'Осло', slug: 'oslo', region: 'Норвегия 🇳🇴', emoji: '🛡️', teaser: 'Крепость Акерсхус, Музей Мунка, Парк Вигеланна, острова фьорда.', tags: ['История', 'Культура', 'Скандинавия'], group: 'europe' },
];
