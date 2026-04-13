import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🗺️</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--dark)" }}>
        Страница не найдена
      </h1>
      <p className="mb-6" style={{ color: "var(--grey)" }}>
        Возможно, маршрут был удалён или адрес изменился
      </p>
      <Link
        href="/routes"
        className="px-6 py-3 rounded-xl text-white font-semibold"
        style={{ background: "var(--blue)" }}
      >
        Смотреть маршруты
      </Link>
    </div>
  );
}
