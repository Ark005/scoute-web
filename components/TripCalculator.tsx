"use client";

import { useState, useMemo, useEffect } from "react";
import type { CityBudget } from "@/lib/types";

type Level = "budget" | "mid" | "premium";
type TravelMode = "flight" | "car" | "none";

const LEVEL_LABELS: Record<Level, string> = {
  budget: "Бюджетно",
  mid: "Средний",
  premium: "Комфорт",
};

const LEVEL_EMOJI: Record<Level, string> = {
  budget: "🏠",
  mid: "🏨",
  premium: "🏩",
};

const MEAL_EMOJI: Record<Level, string> = {
  budget: "🍞",
  mid: "🍽",
  premium: "🥂",
};

interface Props {
  budgets: CityBudget[];
}

export default function TripCalculator({ budgets }: Props) {
  const [citySlug, setCitySlug] = useState(budgets[0]?.slug || "");
  const [days, setDays] = useState(7);
  const [hotelLevel, setHotelLevel] = useState<Level>("mid");
  const [mealLevel, setMealLevel] = useState<Level>("mid");
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [travelMode, setTravelMode] = useState<TravelMode>("flight");
  const [flightCost, setFlightCost] = useState(250);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightSource, setFlightSource] = useState("");
  const [fuelBudget, setFuelBudget] = useState(150);

  // Auto-fetch flight price when city or travel mode changes
  useEffect(() => {
    if (travelMode !== "flight" || !citySlug) return;
    setFlightLoading(true);
    fetch(`https://scoute.app/api/flight-price/?origin=MOW&destination=${citySlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.price_usd) {
          setFlightCost(Math.round(data.price_usd));
          setFlightSource(
            `Aviasales: от ${data.price_rub?.toLocaleString()} руб (~$${Math.round(data.price_usd)})`
          );
        }
      })
      .catch(() => {})
      .finally(() => setFlightLoading(false));
  }, [citySlug, travelMode]);

  const city = budgets.find((b) => b.slug === citySlug);

  // API list returns flat numbers, detail returns {price, label}
  const hp = (v: any) => (typeof v === "number" ? v : v?.price ?? 0);

  const calc = useMemo(() => {
    if (!city) return null;
    const hotelPrices = {
      budget: hp(city.hotel.budget),
      mid: hp(city.hotel.mid),
      premium: hp(city.hotel.premium),
    };
    const mealPrices = {
      budget: hp(city.meal.budget),
      mid: hp(city.meal.mid),
      premium: hp(city.meal.premium),
    };

    const hotelPerNight = hotelPrices[hotelLevel];
    const mealPerMeal = mealPrices[mealLevel];

    const hotelTotal = hotelPerNight * days;
    const foodTotal = mealPerMeal * mealsPerDay * days * travelers;
    const transportTotal = city.transport_daily * days * travelers;

    let travelTotal = 0;
    if (travelMode === "flight") travelTotal = flightCost * travelers;
    else if (travelMode === "car") travelTotal = fuelBudget;

    const total = hotelTotal + foodTotal + transportTotal + travelTotal;

    return {
      hotel: { perNight: hotelPerNight, total: hotelTotal },
      food: { perMeal: mealPerMeal, total: foodTotal },
      transport: { perDay: city.transport_daily, total: transportTotal },
      travel: { total: travelTotal },
      total,
    };
  }, [city, days, hotelLevel, mealLevel, mealsPerDay, travelers, travelMode, flightCost, fuelBudget]);

  if (!budgets.length) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-500">
        Нет данных для калькулятора
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Калькулятор поездки</h1>
      <p className="text-gray-500 mb-8">
        Рассчитайте примерный бюджет поездки в Грузию
      </p>

      {/* City selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
        {budgets.map((b) => (
          <button
            key={b.slug}
            onClick={() => setCitySlug(b.slug)}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              citySlug === b.slug
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300"
            }`}
          >
            {b.city}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Days & travelers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Дней
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold w-8 text-center">{days}</span>
                <button
                  onClick={() => setDays(days + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Путешественников
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold w-8 text-center">
                  {travelers}
                </span>
                <button
                  onClick={() => setTravelers(travelers + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hotel level */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Жильё</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["budget", "mid", "premium"] as Level[]).map((level) => (
              <button
                key={level}
                onClick={() => setHotelLevel(level)}
                className={`p-4 rounded-xl text-center transition-all ${
                  hotelLevel === level
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                }`}
              >
                <div className="text-2xl mb-1">{LEVEL_EMOJI[level]}</div>
                <div className="text-xs text-gray-500">{LEVEL_LABELS[level]}</div>
                <div className="text-lg font-bold mt-1">
                  ${hp(city?.hotel[level]) ?? 0}
                  <span className="text-xs text-gray-400 font-normal">/ночь</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Meal level */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Еда ({mealsPerDay} приёма в день)
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(["budget", "mid", "premium"] as Level[]).map((level) => (
              <button
                key={level}
                onClick={() => setMealLevel(level)}
                className={`p-4 rounded-xl text-center transition-all ${
                  mealLevel === level
                    ? "bg-orange-50 border-2 border-orange-400"
                    : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                }`}
              >
                <div className="text-2xl mb-1">{MEAL_EMOJI[level]}</div>
                <div className="text-xs text-gray-500">
                  {(typeof city?.meal[level] === "object" ? city?.meal[level]?.label : null) ?? LEVEL_LABELS[level]}
                </div>
                <div className="text-lg font-bold mt-1">
                  ${hp(city?.meal[level]) ?? 0}
                  <span className="text-xs text-gray-400 font-normal">/приём</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Приёмов пищи:</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setMealsPerDay(n)}
                className={`px-3 py-1 rounded-full ${
                  mealsPerDay === n
                    ? "bg-orange-100 text-orange-700 font-medium"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Travel mode */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Как добираться</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setTravelMode("flight")}
              className={`p-4 rounded-xl text-center transition-all ${
                travelMode === "flight"
                  ? "bg-indigo-50 border-2 border-indigo-500"
                  : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
              }`}
            >
              <div className="text-2xl mb-1">✈️</div>
              <div className="text-xs text-gray-500">Самолёт</div>
            </button>
            <button
              onClick={() => setTravelMode("car")}
              className={`p-4 rounded-xl text-center transition-all ${
                travelMode === "car"
                  ? "bg-indigo-50 border-2 border-indigo-500"
                  : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
              }`}
            >
              <div className="text-2xl mb-1">🚗</div>
              <div className="text-xs text-gray-500">На авто</div>
            </button>
            <button
              onClick={() => setTravelMode("none")}
              className={`p-4 rounded-xl text-center transition-all ${
                travelMode === "none"
                  ? "bg-indigo-50 border-2 border-indigo-500"
                  : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
              }`}
            >
              <div className="text-2xl mb-1">📍</div>
              <div className="text-xs text-gray-500">Уже там</div>
            </button>
          </div>

          {travelMode === "flight" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Перелёт туда-обратно на 1 чел., $
              </label>
              <input
                type="number"
                value={flightCost}
                onChange={(e) => setFlightCost(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
              />
              {flightLoading && (
                <p className="text-xs text-blue-500 mt-1">Загрузка цен Aviasales...</p>
              )}
              {flightSource && !flightLoading && (
                <p className="text-xs text-green-600 mt-1">{flightSource}</p>
              )}
            </div>
          )}
          {travelMode === "car" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Бензин на всю поездку, $
              </label>
              <input
                type="number"
                value={fuelBudget}
                onChange={(e) => setFuelBudget(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Results */}
        {calc && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-medium text-blue-200 mb-4">
              {city?.city}, {days} дней, {travelers} чел.
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">
                  🏨 Жильё ({days} ночей x ${calc.hotel.perNight})
                </span>
                <span className="font-bold">${calc.hotel.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">
                  🍽 Еда ({mealsPerDay} x {days} дн. x {travelers} чел.)
                </span>
                <span className="font-bold">${calc.food.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">
                  🚌 Транспорт ({days} дн.)
                </span>
                <span className="font-bold">${calc.transport.total}</span>
              </div>
              {calc.travel.total > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">
                    {travelMode === "flight" ? "✈️ Перелёт" : "⛽ Бензин"}
                  </span>
                  <span className="font-bold">${calc.travel.total}</span>
                </div>
              )}
              <div className="border-t border-blue-400 pt-3 flex justify-between items-center">
                <span className="text-lg font-medium">Итого</span>
                <span className="text-3xl font-black">${calc.total}</span>
              </div>
            </div>

            <p className="text-xs text-blue-300">
              * Примерные цены. Отель — за номер. Еда и транспорт — на человека.
              Актуальность: апрель 2026.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
