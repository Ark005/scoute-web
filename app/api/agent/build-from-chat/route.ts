import { NextRequest } from "next/server";
import { proxyToScoute } from "@/lib/api-proxy";

export const GET     = (req: NextRequest) => proxyToScoute(req, "agent/build-from-chat");
export const POST    = (req: NextRequest) => proxyToScoute(req, "agent/build-from-chat");
