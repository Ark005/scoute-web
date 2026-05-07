import { CITIES } from "@/lib/cities-data";
import { notFound, redirect } from "next/navigation";

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();
  // Open Flutter PWA — root serves the Flutter app
  redirect("/");
}
