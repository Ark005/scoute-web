import type { Metadata } from "next";
import TripDraftClient from "@/components/TripDraftClient";

export const metadata: Metadata = {
  title: "Мой маршрут | Scoute",
  description: "Черновик маршрута: места и события, которые вы добавили из Scout.",
  robots: "noindex, nofollow",
};

export default function TripDraftPage() {
  return <TripDraftClient />;
}
