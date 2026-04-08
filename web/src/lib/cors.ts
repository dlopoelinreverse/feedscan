import { NextResponse } from "next/server";

const isDev =
  process.env.NODE_ENV === "development" ||
  !process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN.includes("localhost");

function getAllowedOrigin(request: Request): string {
  if (isDev) return request.headers.get("origin") ?? "*";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return rootDomain ? `https://${rootDomain}` : "*";
}

export function corsHeaders(request: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleOptions(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export function jsonWithCors(
  request: Request,
  body: unknown,
  init: ResponseInit = {}
) {
  const headers = new Headers(init.headers);
  const cors = corsHeaders(request);
  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
  headers.set("Content-Type", "application/json");
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers,
  });
}
