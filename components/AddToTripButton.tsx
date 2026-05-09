"use client";

import { useEffect, useState } from "react";
import {
  addToTripDraft,
  isInTripDraft,
  removeFromTripDraft,
  subscribeTripDraft,
  type TripDraftItemInput,
} from "@/lib/tripDraft";

type Props = {
  item: TripDraftItemInput;
  variant?: "compact" | "full";
  className?: string;
};

export default function AddToTripButton({ item, variant = "compact", className = "" }: Props) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(isInTripDraft(item.kind, item.id));
    return subscribeTripDraft(() => {
      setAdded(isInTripDraft(item.kind, item.id));
    });
  }, [item.kind, item.id]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (added) {
      removeFromTripDraft(item.kind, item.id);
    } else {
      addToTripDraft(item);
    }
  };

  const label = added ? "В маршруте ✓" : variant === "full" ? "+ В маршрут" : "+ В маршрут";

  return (
    <button
      type="button"
      onClick={handleClick}
      title={added ? "Убрать из маршрута" : "Добавить в маршрут"}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition ${className}`}
      style={{
        background: added ? "#10B981" : "var(--blue, #2563EB)",
        color: "white",
      }}
    >
      {label}
    </button>
  );
}
