import AIChat from "@/components/AIChat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-планировщик маршрутов | Scoute",
  description:
    "Расскажите AI-помощнику что хотите от поездки — он соберёт маршрут под ваши даты, бюджет и темп. Сохраните и откройте в приложении в поездке.",
};

export default function AutopilotPage() {
  return (
    <main>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: "var(--dark)" }}>
          🤖 AI-планировщик
        </h1>
        <p className="text-sm text-gray-600">
          Опишите поездку как другу — куда, на сколько, что важно. AI соберёт программу
          по часам, сохранит и пришлёт ссылку открыть в приложении.
        </p>
      </div>
      <AIChat />
    </main>
  );
}
