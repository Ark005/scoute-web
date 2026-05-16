import { NextRequest } from "next/server";
import { proxyToScoute } from "@/lib/api-proxy";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToScoute(req, `trip/${id}`);
}
