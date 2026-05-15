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

function redirectTo(
  domain: string,
  path: string,
  source?: NextResponse
): NextResponse {
  const protocol = domain.includes("localhost") ? "http" : "https";
  const response = NextResponse.redirect(`${protocol}://${domain}${path}`);
  if (source) {
    source.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value, c);
    });
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, sessionExpired } = await updateSession(request);
  const hostname = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname } = request.nextUrl;

  // ── DEV / UNKNOWN HOST ───────────────────────────────────────────────────
  // Single-origin: apply landing-gate + dashboard guard on the same host
  if (
    isLocalhost(hostname) ||
    (!hostname.endsWith(ROOT_DOMAIN) &&
      hostname !== AUTH_DOMAIN &&
      hostname !== APP_DOMAIN &&
      hostname !== ROOT_DOMAIN)
  ) {
    if (pathname === "/") {
      if (user) {
        return redirectTo(hostname, "/dashboard", supabaseResponse);
      }
      if (sessionExpired) {
        return redirectTo(hostname, "/login?error=stale_session", supabaseResponse);
      }
      return supabaseResponse;
    }
    if (pathname.startsWith("/dashboard") && !user) {
      return redirectTo(hostname, "/login", supabaseResponse);
    }
    return supabaseResponse;
  }

  // ── ROOT DOMAIN ──────────────────────────────────────────────────────────
  // feedscan.leopoldev → /, /privacy, /terms, /f/*
  if (hostname === ROOT_DOMAIN) {
    // Landing: authenticated → dashboard, expired session → login, else show
    if (pathname === "/") {
      if (user) {
        return redirectTo(APP_DOMAIN, "/dashboard", supabaseResponse);
      }
      if (sessionExpired) {
        return redirectTo(AUTH_DOMAIN, "/login?error=stale_session", supabaseResponse);
      }
      return supabaseResponse;
    }
    // Authorised paths
    if (
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/f/")
    ) {
      return supabaseResponse;
    }
    // /dashboard/* → app.
    if (pathname.startsWith("/dashboard")) {
      return redirectTo(APP_DOMAIN, pathname, supabaseResponse);
    }
    // /login, /register, /onboarding → auth.
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/onboarding")
    ) {
      return redirectTo(AUTH_DOMAIN, pathname, supabaseResponse);
    }
    // /api/* (except auth callback) → app.
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
      return redirectTo(APP_DOMAIN, pathname, supabaseResponse);
    }
    // Everything else → root home
    return redirectTo(ROOT_DOMAIN, "/", supabaseResponse);
  }

  // ── AUTH DOMAIN ──────────────────────────────────────────────────────────
  // auth.feed-scan.leopoldev → /login, /register, /onboarding, /api/auth/*
  if (hostname === AUTH_DOMAIN) {
    // Redirect authenticated users to app
    if (user && (pathname === "/login" || pathname === "/register")) {
      return redirectTo(APP_DOMAIN, "/dashboard", supabaseResponse);
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
      return redirectTo(ROOT_DOMAIN, "/", supabaseResponse);
    }
    // /dashboard/* → app.
    if (pathname.startsWith("/dashboard")) {
      return redirectTo(APP_DOMAIN, pathname, supabaseResponse);
    }
    // Everything else → root
    return redirectTo(ROOT_DOMAIN, "/", supabaseResponse);
  }

  // ── APP DOMAIN ───────────────────────────────────────────────────────────
  // app.feed-scan.leopoldev → /dashboard/*, /api/*
  if (hostname === APP_DOMAIN) {
    // / → root
    if (pathname === "/") {
      return redirectTo(ROOT_DOMAIN, "/", supabaseResponse);
    }
    // /login, /register → auth.
    if (pathname === "/login" || pathname === "/register") {
      return redirectTo(AUTH_DOMAIN, pathname, supabaseResponse);
    }
    // /dashboard/* — check session
    if (pathname.startsWith("/dashboard")) {
      if (!user) {
        return redirectTo(AUTH_DOMAIN, "/login", supabaseResponse);
      }
      return supabaseResponse;
    }
    // /api/* — allow
    if (pathname.startsWith("/api/")) {
      return supabaseResponse;
    }
    // Everything else → root
    return redirectTo(ROOT_DOMAIN, "/", supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
