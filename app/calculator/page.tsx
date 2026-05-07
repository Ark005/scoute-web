import { getCityBudgets } from "@/lib/api";
import TripCalculator from "@/components/TripCalculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Калькулятор поездки — Scout·E",
  description:
    "Рассчитайте бюджет поездки в Грузию: отели, еда, транспорт, перелёт. Средние цены по городам.",
};

export const revalidate = 3600;

export default async function CalculatorPage() {
  const budgets = await getCityBudgets().catch(() => []);
  return <TripCalculator budgets={budgets} />;
}
