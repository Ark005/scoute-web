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

type CityPreview = {
  slug: string;
  name: string;
  cover: string;
  attractions_count: number;
  restaurants_count: number;
  top_pois: string[];
  top_restaurants: { id: number; name: string; rating?: number | null }[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  pois?: Poi[];
  cityPreview?: CityPreview;
  citySlug?: string;
};

const SLUG_TO_NAME: Record<string, string> = {
  tbilisi: "Тбилиси",
  batumi: "Батуми",
  kutaisi: "Кутаиси",
  mtskheta: "Мцхета",
  sighnaghi: "Сигнахи",
  telavi: "Телави",
  kazbegi: "Казбеги",
  mestia: "Местиа",
  borjomi: "Боржоми",
  bakuriani: "Бакуриани",
  gudauri: "Гудаури",
  gori: "Гори",
  khevsureti: "Хевсуретия",
  tusheti: "Тушетия",
  racha: "Рача",
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

  async function fetchCityPreview(slug: string): Promise<CityPreview | null> {
    try {
      const res = await fetch(`${BASE}/city-pois/?city=${slug}`);
      if (!res.ok) return null;
      const data = await res.json();
      const atts = (data.attractions || []).filter((a: any) => a.image_url);
      const rests = (data.restaurants || []);
      const cover = atts[0]?.image_url || "";
      return {
        slug,
        name: SLUG_TO_NAME[slug] || slug,
        cover: cover.startsWith("http") ? cover : (cover ? `https://scoute.app${cover}` : ""),
        attractions_count: (data.attractions || []).length,
        restaurants_count: rests.length,
        top_pois: atts.slice(0, 4).map((a: any) => a.name),
        top_restaurants: rests.slice(0, 3).map((r: any) => ({
          id: r.id, name: r.name, rating: r.rating,
        })),
      };
    } catch {
      return null;
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
    const cityPromise: Promise<CityPreview | null> = citySlug
      ? fetchCityPreview(citySlug)
      : Promise.resolve(null);

    try {
      const [chatRes, cityPreview] = await Promise.all([
        fetch(`${BASE}/chat/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, city_slug: citySlug }),
        }),
        cityPromise,
      ]);
      const data = chatRes.ok ? await chatRes.json() : { reply: null };
      const replyText =
        data.reply ||
        (cityPreview
          ? `Расскажу про ${cityPreview.name}. AI-связь шалит, но базу мест я подтянул — смотрите карточку ниже.`
          : "AI-сервис временно недоступен. Соберите маршрут кнопкой ниже.");
      const newMsgs: Message[] = [
        ...next,
        {
          role: "assistant",
          content: replyText,
          citySlug: citySlug || undefined,
        },
      ];
      if (cityPreview) {
        newMsgs.push({
          role: "assistant",
          content: "",
          cityPreview,
          citySlug: citySlug || undefined,
        });
      }
      setMessages(newMsgs);
    } catch {
      const cityPreview = await cityPromise;
      const newMsgs: Message[] = [
        ...next,
        {
          role: "assistant",
          content: "AI-сервис временно недоступен. Соберите маршрут кнопкой ниже.",
          citySlug: citySlug || undefined,
        },
      ];
      if (cityPreview) {
        newMsgs.push({
          role: "assistant", content: "", cityPreview,
          citySlug: citySlug || undefined,
        });
      }
      setMessages(newMsgs);
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
        {messages.map((m, i) => {
          // CITY PREVIEW (rich card как во Flutter)
          if (m.cityPreview) {
            const cp = m.cityPreview;
            return (
              <div key={i} className="mb-4 ml-10 mr-4">
                <div
                  className="overflow-hidden rounded-2xl bg-white"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: "1px solid #E5E7EB" }}
                >
                  {cp.cover && (
                    <div className="relative h-40 bg-gray-100">
                      <img
                        src={cp.cover}
                        alt={cp.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div
                      className="font-bold mb-1.5"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: 20,
                        color: "var(--dark)",
                      }}
                    >
                      {cp.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1">📍 {cp.attractions_count} мест</span>
                      <span className="flex items-center gap-1">🍽 {cp.restaurants_count} рест.</span>
                    </div>
                    {cp.top_pois.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {cp.top_pois.map((n) => (
                          <span
                            key={n}
                            className="px-2 py-1 rounded-md text-[11px] text-gray-600"
                            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
                          >
                            {n.length > 28 ? n.slice(0, 28) + "…" : n}
                          </span>
                        ))}
                      </div>
                    )}
                    {cp.top_restaurants.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {cp.top_restaurants.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 text-xs">
                            <span style={{ color: "#F97316" }}>🍽</span>
                            <span style={{ color: "var(--dark)" }}>{r.name}</span>
                            {r.rating && (
                              <span className="text-gray-400">★ {r.rating.toFixed(1)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <a
                      href={`/cities/${cp.slug}`}
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
                      style={{ background: "var(--blue)" }}
                    >
                      🗺 Открыть маршрут
                    </a>
                  </div>
                </div>
              </div>
            );
          }

          // TEXT MESSAGE
          return (
            <div key={i} className="mb-3">
              <div className={`flex items-start gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "#FF6B1B" }}
                  >
                    S
                  </div>
                )}
                <div
                  className="max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === "user"
                      ? { background: "var(--blue)", color: "white" }
                      : { background: "#F3F4F6", color: "var(--dark)" }
                  }
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
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
