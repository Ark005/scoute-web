import Link from "next/link";
import CitiesExplore from "@/components/CitiesExplore";

export const metadata = {
  title: "Городские гиды — Scout",
  description: "Достопримечательности, маршруты и советы для городов России и мира.",
};

export default function CitiesPage() {
  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        <Link
          href="/georgia"
          className="block rounded-xl p-4 transition hover:opacity-95"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-white text-sm font-bold mb-0.5">
                🇬🇪 Спецпроект — Грузия
              </div>
              <div className="text-white/80 text-xs">
                17 городов и регионов · 6 авторских маршрутов · AI-планировщик
              </div>
            </div>
            <div className="text-white text-sm font-semibold whitespace-nowrap">
              Открыть →
            </div>
          </div>
        </Link>
      </div>
      <CitiesExplore />
    </>
  );
}
