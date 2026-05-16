import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://scoute.app/api";

export async function proxyToScoute(req: NextRequest, path: string): Promise<NextResponse> {
  const search = req.nextUrl.search || "";
  const trailing = path.endsWith("/") ? "" : "/";
  const url = `${UPSTREAM}/${path}${trailing}${search}`;

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await req.text()
    : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
