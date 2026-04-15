# Задача для Sonnet: Фаза 1 — Scout·E Web

## Контекст
Проект Next.js 16 + TypeScript + Tailwind CSS 4 + React-Leaflet.
Расположение: `/Users/arkadijstul/Desktop/Скаут/scoute-web/`

Сейчас работает:
- `/routes` — каталог маршрутов (10 маршрутов из API)
- `/routes/[slug]` — детальная страница с картой
- `/routes/[slug]/plan` — планировщик с drag&drop
- `/` — сейчас обслуживается Flutter (не Next.js)

API: `https://scoute.app/api/auto/routes/` и `https://scoute.app/api/auto/routes/<slug>/`

## Дизайн токены (используй везде)
```css
--dark: #111827
--grey: #6B7280
--blue: #1B4DFF
--orange: #FF6B1B
--bg: #F9FAFB
```

## Задачи (делай по порядку, после каждой — проверяй `npm run build`)

### 1. Навигация — компонент `components/NavBar.tsx`
Создай навигационный header для всех страниц:
- **Desktop**: горизонтальная полоса сверху, высота 56px, фон `--dark`
  - Слева: лого "Scout·E" (текст, font-bold, белый)
  - Справа: ссылки "Маршруты" (`/routes`), "Автопилот" (`/autopilot`), "Города" (`/cities`)
  - Активная ссылка подсвечена `--blue`
- **Mobile** (< 768px): тот же header но ссылки становятся иконками или hamburger menu
- Используй `usePathname()` из `next/navigation` для определения активной страницы
- Добавь в `app/layout.tsx`

### 2. Исправь регионы в каталоге — `components/RouteCatalog.tsx`
Сейчас регионы показываются как коды (`central`, `moscow_region`). Замени на человеческие названия:
```typescript
const REGION_LABELS: Record<string, string> = {
  moscow_region: 'Подмосковье',
  central: 'Центральная Россия',
  south: 'Юг России',
  caucasus: 'Кавказ',
  siberia: 'Сибирь',
  ural: 'Урал',
  volga: 'Поволжье',
  northwest: 'Северо-Запад',
  cis: 'СНГ',
  europe: 'Европа',
};
```
Применяй маппинг:
- В фильтрах-чипах региона
- В карточках маршрутов (RouteCard)
- В детальной странице (RouteDetailView) — там уже есть REGION_LABELS, проверь полноту

### 3. Автопилот — страница `/autopilot`
Создай `app/autopilot/page.tsx` + `components/AutopilotWizard.tsx`

5-шаговый визард:
- **Шаг 0**: Выбор региона (dropdown или chip-сетка из 10 регионов + "Куда угодно")
- **Шаг 1**: Количество дней (кнопки 1-7 + "Больше недели")
- **Шаг 2**: Интересы (multi-select чипы): История, Архитектура, Природа, Горы, Море, Озёра, Леса, Религия, Культура, Активный спорт, Гастрономия, Смотровые, Усадьбы, Монастыри, Горные дороги, Степи, Реки, Водопады, Пещеры
- **Шаг 3**: Тип транспорта (3 кнопки): Любой автомобиль, Внедорожник (SUV), Полный офроуд
- **Шаг 4**: Результаты — показывай карточки маршрутов (переиспользуй RouteCard)

API endpoint: `GET /api/auto/autopilot/?region=X&min_days=X&max_days=X&tags=X,Y,Z&vehicle=any|suv|offroad`

Дизайн визарда:
- Каждый шаг — полноэкранный блок с заголовком, вариантами выбора и кнопкой "Дальше →"
- Кнопка "← Назад" (кроме шага 0)
- Прогресс-бар сверху (5 точек)
- На мобильном — вертикально, на десктопе — центрированный блок max-w-lg
- Анимация перехода между шагами (opacity + translateX)

### 4. Главная страница — `app/page.tsx`
Сейчас главная отдаёт hero + 3 карточки. Сделай полноценную landing:
- **Hero**: большой заголовок "Путешествуй по России на авто" + подзаголовок + CTA кнопка "Смотреть маршруты"
- **Секция "Как это работает"**: 3 колонки с иконками (1. Выбери маршрут 2. Планируй остановки 3. Езжай с навигацией)
- **Секция "Популярные маршруты"**: 3 карточки из API `/api/auto/featured/` (добавь endpoint в `lib/api.ts`)
- **Секция "Автопилот"**: блок с описанием + кнопка "Подобрать маршрут" → `/autopilot`
- **Footer**: лого Scout·E + ссылки + копирайт

### 5. Loading и Error states
- Создай `app/routes/loading.tsx` — скелетон-сетка (3 серых прямоугольника пульсируют)
- Создай `app/routes/[slug]/loading.tsx` — скелетон карты + список
- Создай `app/routes/error.tsx` — "Что-то пошло не так" + кнопка "Попробовать снова"
- Создай `app/not-found.tsx` — "Страница не найдена" + ссылка на главную

### 6. SEO
- В `app/layout.tsx` добавь:
  ```tsx
  metadataBase: new URL('https://scoute.app')
  ```
- Создай `app/sitemap.ts`:
  ```tsx
  import { getRoutes } from '@/lib/api'
  export default async function sitemap() {
    const routes = await getRoutes()
    return [
      { url: 'https://scoute.app/routes', changeFrequency: 'weekly', priority: 1 },
      ...routes.map(r => ({
        url: `https://scoute.app/routes/${r.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))
    ]
  }
  ```
- Создай `app/robots.ts`:
  ```tsx
  export default function robots() {
    return {
      rules: { userAgent: '*', allow: '/', disallow: '/api/' },
      sitemap: 'https://scoute.app/sitemap.xml',
    }
  }
  ```
- На каждой странице маршрута добавь JSON-LD (schema.org TouristTrip):
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": "...",
    "description": "...",
    "touristType": "Автотуризм"
  }
  </script>
  ```

### 7. Mobile touch fix
В `RouteDetailView.tsx` и карточках: `onMouseEnter/onMouseLeave` не работает на touch. Добавь:
```tsx
onTouchStart={() => onHover(wp.id)}
onTouchEnd={() => onHover(null)}
```

### 8. Добавь endpoint featured в API клиент
В `lib/api.ts` добавь:
```typescript
export async function getFeaturedRoutes(): Promise<RouteListItem[]> {
  return get<RouteListItem[]>("/auto/featured/");
}
```

## Важные правила
- После КАЖДОЙ задачи запусти `npm run build` и убедись что нет ошибок
- НЕ трогай существующие работающие компоненты если не указано иное
- Используй только `style={{ color: 'var(--blue)' }}` для цветов из дизайн-токенов
- Все тексты на русском языке
- `"use client"` только для интерактивных компонентов (визард, навигация)
- SSR/SSG для всех страниц где возможно
- Tailwind CSS для layout, spacing, responsive
- НЕ создавай тесты, README, документацию

## Деплой
После завершения:
```bash
git add -A && git commit -m "phase1: nav, autopilot, landing, SEO, loading states"
git push
ssh -p 23321 root@217.28.223.106 "deploy-scout-next.sh"
```
