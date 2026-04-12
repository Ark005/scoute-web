import { getRoute, getRoutes } from "@/lib/api";
import RouteDetailView from "@/components/RouteDetailView";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const routes = await getRoutes().catch(() => []);
  return routes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getRoute(slug).catch(() => null);
  if (!route) return {};
  return {
    title: `${route.title} — Scout`,
    description: route.description?.slice(0, 160) || `Маршрут по ${route.region}`,
    openGraph: {
      title: route.title,
      description: route.description?.slice(0, 160),
      images: route.preview_image ? [route.preview_image] : [],
    },
  };
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getRoute(slug).catch(() => null);
  if (!route) notFound();

  return <RouteDetailView route={route} />;
}
