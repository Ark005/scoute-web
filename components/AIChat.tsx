"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Хочу 3 дня в Грузии — еда и вино",
  "Тбилиси на выходные с семьёй",
  "Маршрут Кахетия — что обязательно",
  "Сванетия летом — сложно?",
];

const GEORGIA_CITIES = [
  { slug: "tbilisi", name: "Тбилиси" },
  { slug: "batumi", name: "Батуми" },
  { slug: "kutaisi", name: "Кутаиси" },
  { slug: "mtskheta", name: "Мцхета" },
  { slug: "sighnaghi", name: "Сигнахи" },
  { slug: "telavi", name: "Телави" },
  { slug: "kazbegi", name: "Казбеги" },
  { slug: "mestia", name: "Местиа" },
];

export default function AIChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Привет! Я помогу собрать маршрут под ваши даты, бюджет и темп. Расскажите — куда хотите, на сколько и что вам важно (еда / горы / культура / расслабиться)?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [showBuildForm, setShowBuildForm] = useState(false);
  const [buildCity, setBuildCity] = useState("tbilisi");
  const [buildDays, setBuildDays] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, building]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply || "..." }]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Что-то с AI-сервисом сейчас. Попробуйте через минуту или соберите маршрут вручную внизу.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function buildAndSave() {
    setBuilding(true);
    try {
      const r1 = await fetch(`${BASE}/agent/build-from-chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_slug: buildCity,
          days: buildDays,
          must_see_names: [],
          fill_with_must_see: true,
          min_count: 5,
        }),
      });
      if (!r1.ok) throw new Error(`build ${r1.status}`);
      const program = await r1.json();

      const cityName =
        GEORGIA_CITIES.find((c) => c.slug === buildCity)?.name || buildCity;
      const r2 = await fetch(`${BASE}/trip/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${cityName} — ${buildDays} ${buildDays === 1 ? "день" : "дн"}`,
          country_slug: "georgia",
          city_slug: buildCity,
          program,
          meta: { days: buildDays, source: "chat" },
          source: "chat",
        }),
      });
      if (!r2.ok) throw new Error(`save ${r2.status}`);
      const saved = await r2.json();
      router.push(`/trip/${saved.id}`);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Не получилось собрать программу. Скорее всего временная ошибка. Попробуйте ещё раз.",
        },
      ]);
      setBuilding(false);
    }
  }

  const showStarters = messages.length === 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div
        ref={scrollRef}
        className="rounded-2xl border bg-white p-4 mb-4 overflow-y-auto"
        style={{ borderColor: "#E5E7EB", height: "min(60vh, 480px)" }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={
                m.role === "user"
                  ? { background: "var(--blue)", color: "white" }
                  : { background: "#F3F4F6", color: "var(--dark)" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div
              className="px-4 py-2 rounded-2xl text-sm"
              style={{ background: "#F3F4F6", color: "#6B7280" }}
            >
              думаю…
            </div>
          </div>
        )}
        {building && (
          <div className="flex justify-start mb-3">
            <div
              className="px-4 py-2 rounded-2xl text-sm"
              style={{ background: "#FEF3C7", color: "#92400E" }}
            >
              собираю программу по часам…
            </div>
          </div>
        )}
      </div>

      {showStarters && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-left text-sm px-3 py-2 rounded-xl border transition hover:bg-blue-50 hover:border-blue-400"
              style={{ borderColor: "#E5E7EB", background: "white", color: "var(--dark)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишите что хотите от поездки…"
          disabled={loading || building}
          className="flex-1 px-4 py-3 rounded-xl border outline-none focus:border-blue-400"
          style={{ borderColor: "#E5E7EB", background: "white" }}
        />
        <button
          type="submit"
          disabled={loading || building || !input.trim()}
          className="px-5 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--blue)" }}
        >
          ➤
        </button>
      </form>

      {!showBuildForm ? (
        <button
          onClick={() => setShowBuildForm(true)}
          className="w-full px-5 py-3 rounded-xl font-semibold border transition hover:bg-blue-50 hover:border-blue-400"
          style={{ borderColor: "#E5E7EB", background: "white", color: "var(--dark)" }}
          disabled={building}
        >
          ✨ Собрать программу по часам и сохранить
        </button>
      ) : (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "#E5E7EB", background: "white" }}
        >
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--dark)" }}>
            Под какой город и сколько дней собрать?
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {GEORGIA_CITIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setBuildCity(c.slug)}
                className="px-3 py-1.5 rounded-lg text-sm border transition"
                style={{
                  borderColor: buildCity === c.slug ? "var(--blue)" : "#E5E7EB",
                  background: buildCity === c.slug ? "#EFF6FF" : "white",
                  color: "var(--dark)",
                }}
                disabled={building}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">Дней:</span>
            {[1, 2, 3, 5, 7].map((d) => (
              <button
                key={d}
                onClick={() => setBuildDays(d)}
                className="w-9 h-9 rounded-lg text-sm font-semibold border transition"
                style={{
                  borderColor: buildDays === d ? "var(--blue)" : "#E5E7EB",
                  background: buildDays === d ? "#EFF6FF" : "white",
                  color: "var(--dark)",
                }}
                disabled={building}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={buildAndSave}
            disabled={building}
            className="w-full px-5 py-3 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--blue)" }}
          >
            {building ? "Собираю программу…" : "🚀 Собрать и открыть"}
          </button>
        </div>
      )}
    </div>
  );
}
