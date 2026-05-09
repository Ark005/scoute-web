"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTripDraft, subscribeTripDraft } from "@/lib/tripDraft";

export default function TripDraftBadge() {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCount(getTripDraft().length);
    setHydrated(true);
    return subscribeTripDraft(() => setCount(getTripDraft().length));
  }, []);

  if (!hydrated || count === 0) return null;

  return (
    <Link
      href="/trip/draft"
      title={`В маршруте: ${count}`}
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition hover:scale-105"
      style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
    >
      <span aria-hidden>🧭</span>
      <span>{count}</span>
    </Link>
  );
}
