"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrips, removeTrip, TripHistoryEntry } from "@/lib/trip-history";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<TripHistoryEntry[]>([]);

  useEffect(() => {
    setTrips(getTrips());
  }, []);

  if (status === "loading") {
    return (
      <main className="max-w-screen-md mx-auto px-4 py-10">
        <p className="text-gray-500">Загрузка...</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="max-w-screen-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-4" style={{ color: "var(--dark)" }}>
          Войдите в Scoute
        </h1>
        <p className="text-gray-600 mb-6">
          Чтобы сохранять свои маршруты и продолжать там, где остановились — войдите через Google.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition hover:scale-105"
          style={{ background: "var(--blue)" }}
        >
          Войти через Google
        </button>
      </main>
    );
  }

  const handleRemove = (id: string) => {
    removeTrip(id);
    setTrips(getTrips());
  };

  return (
    <main className="max-w-screen-md mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--dark)" }}>
            {session.user.name || "Турист"}
          </h1>
          <div className="text-sm text-gray-500">{session.user.email}</div>
        </div>
      </div>

      <section id="trips" className="mb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--dark)" }}>
          Мои поездки
        </h2>
        {trips.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <p className="text-gray-500 mb-4">Здесь будут все маршруты, которые вы соберёте.</p>
            <Link
              href="/georgia"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition hover:scale-105"
              style={{ background: "var(--blue)" }}
            >
              ✦ Составить первый маршрут
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {trips.map(t => (
              <div
                key={t.id}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: "white", border: "1px solid #E5E7EB" }}
              >
                <Link href={`/trip/${t.id}`} className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: "var(--dark)" }}>{t.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(t.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1"
                  title="Убрать из истории"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          Выйти
        </button>
      </section>
    </main>
  );
}
