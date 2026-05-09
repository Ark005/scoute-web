import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности | Scoute",
  description:
    "Политика обработки персональных данных пользователей сайта scoute.app согласно 152-ФЗ.",
  robots: "noindex, follow",
};

const UPDATED = "9 мая 2026";

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1
        className="font-extrabold mb-2"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: "clamp(28px, 4vw, 40px)",
          color: "var(--dark)",
        }}
      >
        Политика конфиденциальности
      </h1>
      <p className="text-sm text-gray-500 mb-8">Обновлено: {UPDATED}</p>

      <div className="space-y-6 text-[15px] leading-relaxed text-gray-700">
        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            1. Кто оператор
          </h2>
          <p>
            Сайт <strong>scoute.app</strong> (далее — «Сервис»). Обработку персональных
            данных ведёт владелец Сервиса в соответствии с Федеральным законом
            №152-ФЗ «О персональных данных».
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            2. Какие данные собираем
          </h2>
          <p>
            Минимально необходимые данные для предоставления услуг:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Содержимое чата с AI-планировщиком</strong> — тексты сообщений,
              которые пользователь пишет в /autopilot. Используются для генерации
              маршрута и улучшения качества ответов AI.
            </li>
            <li>
              <strong>Параметры сохранённой программы поездки</strong> (`/trip/&lt;id&gt;`)
              — выбранный город, количество дней, состав маршрута. Без привязки к
              ФИО / email / телефону, если пользователь сам не ввёл их в чат.
            </li>
            <li>
              <strong>Технические данные</strong> — IP-адрес, тип устройства/браузера,
              время визита (стандартные nginx-логи). Хранятся 30 дней для предотвращения
              абуза/спама.
            </li>
            <li>
              <strong>Данные cookie</strong> — только функциональные (предпочтения
              интерфейса). Сторонние трекеры (Google Analytics, Я.Метрика и т.п.)
              НЕ подключены.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            3. Зачем
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Сгенерировать программу поездки по запросу пользователя.</li>
            <li>Сохранить программу для возможности поделиться/открыть в приложении.</li>
            <li>Защита от автоматизированного абуза AI-эндпоинтов.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            4. Где хранятся
          </h2>
          <p>
            База данных PostgreSQL расположена на территории Российской Федерации
            (соответствует требованиям 152-ФЗ ст.18 о локализации). Бэкапы — там же.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            5. Кому передаём
          </h2>
          <p>
            Данные сообщений в AI-чате передаются провайдеру нейросети
            (Pollinations, OpenAI-совместимый API) для генерации ответа. Запросы
            обезличены — без привязки к личности пользователя.
          </p>
          <p className="mt-2">
            При переходе по ссылкам на партнёрские сервисы (Aviasales, Booking,
            GetYourGuide) пользователь покидает Сервис, и применяются правила и
            политики конфиденциальности этих сервисов.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            6. Сколько храним
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Сохранённые программы (`Trip`) — бессрочно, пока сам пользователь не запросит удаление.</li>
            <li>Истории чата — не сохраняем после закрытия вкладки.</li>
            <li>Технические логи — 30 дней.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            7. Ваши права
          </h2>
          <p>
            Пользователь вправе запросить:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Сведения о своих данных, которыми мы располагаем.</li>
            <li>Удаление своих данных (включая сохранённые программы).</li>
            <li>Отзыв согласия на обработку.</li>
          </ul>
          <p className="mt-2">
            Связаться:{" "}
            <a href="mailto:hello@scoute.app" className="underline" style={{ color: "var(--blue)" }}>
              hello@scoute.app
            </a>
            . Ответ в течение 30 дней.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            8. Cookie
          </h2>
          <p>
            Сайт использует только необходимые cookie для работы интерфейса. Сторонние
            рекламные и аналитические трекеры не подключены. Если ситуация изменится,
            эта политика будет обновлена.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--dark)" }}>
            9. Изменения
          </h2>
          <p>
            Мы можем вносить изменения в политику. Дата последнего обновления указана
            сверху. Существенные изменения сообщаем баннером на сайте.
          </p>
        </section>
      </div>
    </main>
  );
}
