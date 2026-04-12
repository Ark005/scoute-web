import { getRoute, getRoutes } from "@/lib/api";
import PlannerView from "@/components/PlannerView";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const routes = await getRoutes().catch(() => []);
  return routes.map((r) => ({ slug: r.slug }));
}

export default async function PlannerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getRoute(slug).catch(() => null);
  if (!route) notFound();

  return <PlannerView route={route} />;
}
