import { NextRequest } from "next/server";
import { proxyToScoute } from "@/lib/api-proxy";

export async function GET(req: NextRequest, { params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  return proxyToScoute(req, `events/${city}`);
}
