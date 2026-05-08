"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://scoute.app/api";

type Poi = {
  id: number;
  type: "attraction" | "restaurant";
  name: string;
  image_url: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  pois?: Poi[];
  citySlug?: string;
};

// Russian keyword → city slug (включая регионы → центральный город региона)
const CITY_KEYWORDS: Array<[RegExp, string]> = [
  [/тбилис/i, "tbilisi"],
  [/батум/i, "batumi"],
  [/кутаис/i, "kutaisi"],
  [/мцхет/i, "mtskheta"],
  [/сигнах/i, "sighnaghi"],
  [/телав/i, "telavi"],
  [/казбег/i, "kazbegi"],
  [/мести/i, "mestia"],
  [/боржом/i, "borjomi"],
  [/бакуриан/i, "bakuriani"],
  [/гудаур/i, "gudauri"],
  [/\bгори\b/i, "gori"],
  [/сванет/i, "mestia"],
  [/кахет/i, "telavi"],
  [/аджари/i, "batumi"],
  [/имерет/i, "kutaisi"],
  [/хевсур/i, "khevsureti"],
  [/тушет/i, "tusheti"],
  [/рача/i, "racha"],
];

function detectCitySlug(text: string): string | null {
  for (const [re, slug] of CITY_KEYWORDS) {
    if (re.test(text)) return slug;
  }
  return null;
}

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
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const r = new SR();
    r.lang = "ru-RU";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    let finalText = "";
    r.onresult = (e: any) => {
      let interim = "";
      finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput((finalText + interim).trim());
    };
    r.onend = () => {
      setListening(false);
      if (finalText.trim()) {
        send(finalText.trim());
        finalText = "";
      }
    };
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
    // Auto-start if ?voice=1 (e.g. from navbar mic)
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("voice") === "1") {
      setTimeout(() => {
        try { r.start(); setListening(true); } catch {}
      }, 300);
    }
    return () => {
      try { r.stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInput("");
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, building]);

  async function fetchPois(slug: string): Promise<Poi[]> {
    try {
      const res = await fetch(`${BASE}/city-pois/?city=${slug}`);
      if (!res.ok) return [];
      const data = await res.json();
      const atts: Poi[] = (data.attractions || [])
        .filter((a: any) => a.image_url)
        .slice(0, 3)
        .map((a: any) => ({
          id: a.id,
          type: "attraction" as const,
          name: a.name,
          image_url: a.image_url,
        }));
      const rests: Poi[] = (data.restaurants || [])
        .filter((r: any) => r.image_url)
        .slice(0, 2)
        .map((r: any) => ({
          id: r.id,
          type: "restaurant" as const,
          name: r.name,
          image_url: r.image_url,
        }));
      return [...atts, ...rests];
    } catch {
      return [];
    }
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userText = text.trim();
    const next: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const citySlug = detectCitySlug(userText);
    const poisPromise: Promise<Poi[]> = citySlug ? fetchPois(citySlug) : Promise.resolve([]);

    try {
      const [chatRes, pois] = await Promise.all([
        fetch(`${BASE}/chat/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, city_slug: citySlug }),
        }),
        poisPromise,
      ]);
      const data = chatRes.ok ? await chatRes.json() : { reply: null };
      const replyText =
        data.reply ||
        "Что-то с AI-сервисом сейчас. Попробуйте через минуту или соберите маршрут кнопкой ниже.";
      setMessages([
        ...next,
        {
          role: "assistant",
          content: replyText,
          pois: pois.length ? pois : undefined,
          citySlug: citySlug || undefined,
        },
      ]);
    } catch {
      const pois = await poisPromise;
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Что-то с AI-сервисом сейчас. Попробуйте через минуту или соберите маршрут кнопкой ниже.",
          pois: pois.length ? pois : undefined,
          citySlug: citySlug || undefined,
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
          <div key={i} className="mb-3">
            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
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
            {m.pois && m.pois.length > 0 && (
              <div className="mt-3 -mx-2">
                <div className="px-2 mb-2 text-xs uppercase tracking-wider text-gray-500">
                  Места рядом
                </div>
                <div className="flex gap-2 overflow-x-auto px-2 pb-2 snap-x">
                  {m.pois.map((p) => (
                    <a
                      key={`${p.type}-${p.id}`}
                      href={`/poi/${p.type}/${p.id}`}
                      className="shrink-0 w-32 snap-start group"
                    >
                      <div
                        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100"
                        style={{ border: "1px solid #E5E7EB" }}
                      >
                        <img
                          src={
                            p.image_url.startsWith("http")
                              ? p.image_url
                              : `https://scoute.app${p.image_url}`
                          }
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <div className="text-[11px] font-semibold leading-tight line-clamp-2">
                            {p.name}
                          </div>
                        </div>
                        <div
                          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: p.type === "restaurant" ? "#F97316" : "#3B82F6",
                            color: "white",
                          }}
                        >
                          {p.type === "restaurant" ? "🍽" : "📍"}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
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
          placeholder={listening ? "Слушаю…" : "Напишите или скажите что хотите от поездки…"}
          disabled={loading || building}
          className="flex-1 px-4 py-3 rounded-xl border outline-none focus:border-blue-400"
          style={{ borderColor: listening ? "#FF6B1B" : "#E5E7EB", background: "white" }}
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={loading || building}
            aria-label={listening ? "Остановить запись" : "Голосовой ввод"}
            title={listening ? "Идёт запись" : "Сказать голосом"}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition disabled:opacity-50"
            style={{
              background: listening ? "#FF6B1B" : "#F3F4F6",
              color: listening ? "white" : "#374151",
              animation: listening ? "pulse 1.2s ease-in-out infinite" : undefined,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={loading || building || !input.trim()}
          className="px-5 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--blue)" }}
        >
          ➤
        </button>
      </form>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>

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
