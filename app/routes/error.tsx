"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--dark)" }}>
        Что-то пошло не так
      </h1>
      <p className="mb-6" style={{ color: "var(--grey)" }}>
        Не удалось загрузить маршруты
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl text-white font-semibold"
        style={{ background: "var(--blue)" }}
      >
        Попробовать снова
      </button>
    </div>
  );
}
