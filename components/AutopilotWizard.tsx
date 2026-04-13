"use client";

import { useState, useEffect } from "react";
import RouteCard from "./RouteCard";
import { RouteListItem } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

const REGIONS: { label: string; value: string }[] = [
  { label: "Куда угодно", value: "" },
  { label: "Подмосковье", value: "moscow_region" },
  { label: "Центральная Россия", value: "central" },
  { label: "Юг России", value: "south" },
  { label: "Кавказ", value: "caucasus" },
  { label: "Сибирь", value: "siberia" },
  { label: "Урал", value: "ural" },
  { label: "Поволжье", value: "volga" },
  { label: "Северо-Запад", value: "northwest" },
  { label: "СНГ", value: "cis" },
];

const TAGS = [
  "История", "Архитектура", "Природа", "Горы", "Море",
  "Озёра", "Леса", "Религия", "Культура", "Гастрономия",
  "Смотровые", "Усадьбы", "Монастыри", "Водопады", "Активный спорт",
];

const VEHICLES: { label: string; icon: string; value: string }[] = [
  { label: "Любой автомобиль", icon: "🚗", value: "any" },
  { label: "Внедорожник (SUV)", icon: "🚙", value: "suv" },
  { label: "Полный офроуд", icon: "🛻", value: "offroad" },
];

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-colors"
          style={{ background: i === step ? "var(--blue)" : "#D1D5DB" }}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function AutopilotWizard() {
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState("");
  const [minDays, setMinDays] = useState(1);
  const [maxDays, setMaxDays] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState("any");
  const [results, setResults] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async (v: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      params.set("min_days", String(minDays));
      params.set("max_days", String(maxDays));
      params.set("vehicle", v);
      if (tags.length > 0) params.set("tags", tags.join(","));
      const res = await fetch(`${BASE}/auto/autopilot/?${params.toString()}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when step 4 is entered (after vehicle selection)
  useEffect(() => {
    if (step === 4) {
      fetchResults(vehicle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const stepWrapperClass =
    "min-h-screen flex flex-col items-center justify-center px-4";
  const contentClass = "max-w-lg w-full";

  // Step 0: Region
  if (step === 0) {
    return (
      <div className={stepWrapperClass}>
        <div className={contentClass}>
          <ProgressDots step={0} />
          <h1 className="text-2xl font-extrabold text-center mb-6" style={{ color: "var(--dark)" }}>
            Куда едем?
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REGIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => { setRegion(r.value); setStep(1); }}
                className="px-4 py-3 rounded-xl border text-sm font-semibold text-center transition hover:border-blue-400 hover:bg-blue-50"
                style={{
                  borderColor: region === r.value ? "var(--blue)" : "#E5E7EB",
                  background: region === r.value ? "#EFF6FF" : "white",
                  color: "var(--dark)",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Days
  if (step === 1) {
    const dayOptions = [1, 2, 3, 4, 5, 6, 7, "8+"];
    return (
      <div className={stepWrapperClass}>
        <div className={contentClass}>
          <ProgressDots step={1} />
          <button
            onClick={() => setStep(0)}
            className="mb-4 text-sm flex items-center gap-1 transition hover:opacity-70"
            style={{ color: "var(--grey)" }}
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-extrabold text-center mb-6" style={{ color: "var(--dark)" }}>
            Сколько дней?
          </h1>
          <div className="grid grid-cols-4 gap-2">
            {dayOptions.map((d) => (
              <button
                key={d}
                onClick={() => {
                  if (d === "8+") {
                    setMinDays(8);
                    setMaxDays(30);
                  } else {
                    setMinDays(Number(d));
                    setMaxDays(Number(d));
                  }
                  setStep(2);
                }}
                className="py-4 rounded-xl border text-base font-bold text-center transition hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: "#E5E7EB", background: "white", color: "var(--dark)" }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Tags
  if (step === 2) {
    return (
      <div className={stepWrapperClass}>
        <div className={contentClass}>
          <ProgressDots step={2} />
          <button
            onClick={() => setStep(1)}
            className="mb-4 text-sm flex items-center gap-1 transition hover:opacity-70"
            style={{ color: "var(--grey)" }}
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-extrabold text-center mb-6" style={{ color: "var(--dark)" }}>
            Что интересует?
          </h1>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-4 py-2 rounded-full border text-sm font-semibold transition"
                  style={{
                    borderColor: selected ? "var(--blue)" : "#E5E7EB",
                    background: selected ? "var(--blue)" : "white",
                    color: selected ? "white" : "var(--dark)",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(3)}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition hover:opacity-90"
            style={{ background: "var(--blue)" }}
          >
            Дальше →
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Vehicle
  if (step === 3) {
    return (
      <div className={stepWrapperClass}>
        <div className={contentClass}>
          <ProgressDots step={3} />
          <button
            onClick={() => setStep(2)}
            className="mb-4 text-sm flex items-center gap-1 transition hover:opacity-70"
            style={{ color: "var(--grey)" }}
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-extrabold text-center mb-6" style={{ color: "var(--dark)" }}>
            Тип машины?
          </h1>
          <div className="flex flex-col gap-3">
            {VEHICLES.map((v) => (
              <button
                key={v.value}
                onClick={() => {
                  setVehicle(v.value);
                  setStep(4);
                }}
                className="flex items-center gap-4 px-6 py-5 rounded-2xl border text-left transition hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: "#E5E7EB", background: "white" }}
              >
                <span className="text-3xl">{v.icon}</span>
                <span className="font-bold text-base" style={{ color: "var(--dark)" }}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Results
  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--bg)" }}>
      <div className="max-w-screen-lg mx-auto">
        <button
          onClick={() => setStep(0)}
          className="mb-6 text-sm flex items-center gap-1 transition hover:opacity-70"
          style={{ color: "var(--grey)" }}
        >
          ← Изменить параметры
        </button>
        <h1 className="text-2xl font-extrabold mb-6" style={{ color: "var(--dark)" }}>
          Маршруты для вас 🎯
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--dark)" }}>
              Маршрутов не найдено
            </p>
            <p className="mb-6 text-sm" style={{ color: "var(--grey)" }}>
              Попробуй изменить параметры
            </p>
            <button
              onClick={() => setStep(0)}
              className="px-6 py-3 rounded-xl text-white font-semibold transition hover:opacity-90"
              style={{ background: "var(--blue)" }}
            >
              ← Начать заново
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <RouteCard key={r.slug} route={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
