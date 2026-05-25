import { NextResponse } from "next/server";

import analyzeBusinessFixture from "./demo-fixtures/analyze-business.json";
import generateFormFixture from "./demo-fixtures/generate-form.json";
import refineFormFixture from "./demo-fixtures/refine-form.json";
import translateFormFixture from "./demo-fixtures/translate-form.json";

export type AiEndpointKey =
  | "analyze-business"
  | "generate-form"
  | "refine-form"
  | "translate-form";

export type AiGuardResult =
  | { allowed: true; bypassed: boolean }
  | { allowed: false; response: Response };

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_GLOBAL_CAP = 200;

// In-memory state. Single Node process on Dokploy; restart = reset is acceptable.
const ipHits = new Map<string, number[]>();
const globalState = { windowStart: Date.now(), count: 0 };

const fixtures: Record<AiEndpointKey, unknown> = {
  "analyze-business": analyzeBusinessFixture,
  "generate-form": generateFormFixture,
  "refine-form": refineFormFixture,
  "translate-form": translateFormFixture,
};

// x-forwarded-for is set by Dokploy/Traefik; the leftmost entry is the original
// client. x-real-ip is used as a fallback for non-proxied setups.
function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real && real.trim()) return real.trim();
  return "unknown";
}

function isWhitelisted(ip: string): boolean {
  const raw = process.env.AI_IP_WHITELIST ?? "";
  if (!raw.trim()) return false;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(ip);
}

function isDemoMode(): boolean {
  return (process.env.DEMO_MODE ?? "").toLowerCase() === "true";
}

function getGlobalCap(): number {
  const raw = process.env.AI_GLOBAL_DAILY_CAP;
  const n = raw ? Number(raw) : DEFAULT_GLOBAL_CAP;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GLOBAL_CAP;
}

function rollGlobalWindow(now: number) {
  if (now - globalState.windowStart >= GLOBAL_WINDOW_MS) {
    globalState.windowStart = now;
    globalState.count = 0;
  }
}

function countIpHits(ip: string, now: number): number[] {
  const arr = (ipHits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  ipHits.set(ip, arr);
  return arr;
}

export async function aiGuard(
  request: Request,
  endpointKey: AiEndpointKey
): Promise<AiGuardResult> {
  const ip = getClientIp(request);

  if (isWhitelisted(ip)) {
    return { allowed: true, bypassed: true };
  }

  if (isDemoMode()) {
    const fixture = fixtures[endpointKey];
    if (!fixture) {
      console.warn(
        `[ai-guard] DEMO_MODE: missing fixture for endpoint "${endpointKey}"`
      );
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Demo content unavailable for this endpoint" },
          { status: 503 }
        ),
      };
    }
    return {
      allowed: false,
      response: NextResponse.json(fixture, { status: 200 }),
    };
  }

  const now = Date.now();
  const recentHits = countIpHits(ip, now);
  if (recentHits.length >= RATE_LIMIT_MAX) {
    const oldest = recentHits[0];
    const retryAfterSec = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000)
    );
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Rate limit reached. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      ),
    };
  }

  rollGlobalWindow(now);
  const cap = getGlobalCap();
  if (globalState.count >= cap) {
    console.warn(
      `[ai-guard] Global daily cap reached (${globalState.count}/${cap}). Refusing further AI calls until window resets.`
    );
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error:
            "Service temporarily unavailable due to demand. Please come back tomorrow.",
        },
        { status: 503 }
      ),
    };
  }

  recentHits.push(now);
  ipHits.set(ip, recentHits);
  globalState.count += 1;

  return { allowed: true, bypassed: false };
}

// Exported for tests only.
export const __testing = {
  reset() {
    ipHits.clear();
    globalState.windowStart = Date.now();
    globalState.count = 0;
  },
  getState() {
    return {
      ipHits: new Map(ipHits),
      globalCount: globalState.count,
      globalWindowStart: globalState.windowStart,
    };
  },
};
