import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "feedscan.leopoldev";
const AUTH_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_DOMAIN || "auth.feed-scan.leopoldev";
const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN || "app.feed-scan.leopoldev";

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.startsWith("localhost:") ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("127.0.0.1:")
  );
}

function redirectTo(domain: string, path: string): NextResponse {
  const protocol = domain.includes("localhost") ? "http" : "https";
  return NextResponse.redirect(`${protocol}://${domain}${path}`);
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const hostname = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname } = request.nextUrl;

  // ── DEV / UNKNOWN HOST ───────────────────────────────────────────────────
  // Allow everything; just protect /dashboard/* if no session
  if (
    isLocalhost(hostname) ||
    (!hostname.endsWith(ROOT_DOMAIN) &&
      hostname !== AUTH_DOMAIN &&
      hostname !== APP_DOMAIN &&
      hostname !== ROOT_DOMAIN)
  ) {
    if (pathname.startsWith("/dashboard") && !user) {
      return redirectTo(hostname, "/login");
    }
    return supabaseResponse;
  }

  // ── ROOT DOMAIN ──────────────────────────────────────────────────────────
  // feedscan.leopoldev → /, /privacy, /terms, /f/*
  if (hostname === ROOT_DOMAIN) {
    // Authorised paths
    if (
      pathname === "/" ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/f/")
    ) {
      return supabaseResponse;
    }
    // /dashboard/* → app.
    if (pathname.startsWith("/dashboard")) {
      return redirectTo(APP_DOMAIN, pathname);
    }
    // /login, /register, /onboarding → auth.
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/onboarding")
    ) {
      return redirectTo(AUTH_DOMAIN, pathname);
    }
    // /api/* (except auth callback) → app.
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
      return redirectTo(APP_DOMAIN, pathname);
    }
    // Everything else → root home
    return redirectTo(ROOT_DOMAIN, "/");
  }

  // ── AUTH DOMAIN ──────────────────────────────────────────────────────────
  // auth.feed-scan.leopoldev → /login, /register, /onboarding, /api/auth/*
  if (hostname === AUTH_DOMAIN) {
    // Redirect authenticated users to app
    if (user && (pathname === "/login" || pathname === "/register")) {
      return redirectTo(APP_DOMAIN, "/dashboard");
    }
    // Authorised paths
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/api/auth/")
    ) {
      return supabaseResponse;
    }
    // / → root
    if (pathname === "/") {
      return redirectTo(ROOT_DOMAIN, "/");
    }
    // /dashboard/* → app.
    if (pathname.startsWith("/dashboard")) {
      return redirectTo(APP_DOMAIN, pathname);
    }
    // Everything else → root
    return redirectTo(ROOT_DOMAIN, "/");
  }

  // ── APP DOMAIN ───────────────────────────────────────────────────────────
  // app.feed-scan.leopoldev → /dashboard/*, /api/*
  if (hostname === APP_DOMAIN) {
    // / → root
    if (pathname === "/") {
      return redirectTo(ROOT_DOMAIN, "/");
    }
    // /login, /register → auth.
    if (pathname === "/login" || pathname === "/register") {
      return redirectTo(AUTH_DOMAIN, pathname);
    }
    // /dashboard/* — check session
    if (pathname.startsWith("/dashboard")) {
      if (!user) {
        return redirectTo(AUTH_DOMAIN, "/login");
      }
      return supabaseResponse;
    }
    // /api/* — allow
    if (pathname.startsWith("/api/")) {
      return supabaseResponse;
    }
    // Everything else → root
    return redirectTo(ROOT_DOMAIN, "/");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
