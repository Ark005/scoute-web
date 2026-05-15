import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://scoute.app/api";

async function handler(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  const path = proxy.join("/");
  const search = req.nextUrl.search || "";
  const url = `${UPSTREAM}/${path}/${search}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await req.text()
    : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
