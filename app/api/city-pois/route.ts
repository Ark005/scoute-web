import { NextRequest } from "next/server";
import { proxyToScoute } from "@/lib/api-proxy";

export const GET = (req: NextRequest) => proxyToScoute(req, "city-pois");
