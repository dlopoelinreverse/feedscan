// Minimal self-contained test for aiGuard. Run with:
//   bun src/lib/ai/guard.test.ts
// No test runner is configured in the repo; this is a smoke test for the
// four code paths (whitelist, DEMO_MODE, rate-limit, global cap).

import { aiGuard, __testing } from "./guard";

function makeReq(ip: string): Request {
  return new Request("http://localhost/api/ai/generate-form", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function run() {
  // --- 1. Whitelist bypass ---
  __testing.reset();
  process.env.AI_IP_WHITELIST = "10.0.0.1, 10.0.0.2";
  process.env.DEMO_MODE = "true";
  process.env.AI_GLOBAL_DAILY_CAP = "200";

  let r = await aiGuard(makeReq("10.0.0.1"), "generate-form");
  assert(r.allowed === true, "whitelisted IP should be allowed");
  assert(
    "bypassed" in r && r.bypassed === true,
    "whitelisted IP should be bypassed=true even with DEMO_MODE=true"
  );
  console.log("✓ whitelist bypass");

  // --- 2. DEMO_MODE returns fixture for non-whitelisted IP ---
  __testing.reset();
  process.env.AI_IP_WHITELIST = "";
  process.env.DEMO_MODE = "true";

  r = await aiGuard(makeReq("1.2.3.4"), "generate-form");
  assert(r.allowed === false, "DEMO_MODE should refuse real call");
  assert("response" in r, "DEMO_MODE should return a response");
  if ("response" in r) {
    assert(r.response.status === 200, "DEMO_MODE response should be 200");
    const body = await r.response.json();
    assert(
      body && typeof body === "object" && "titleFr" in body,
      "DEMO_MODE generate-form fixture should include titleFr"
    );
  }
  console.log("✓ DEMO_MODE fixture");

  // --- 3. Rate-limit per IP ---
  __testing.reset();
  process.env.DEMO_MODE = "false";
  process.env.AI_IP_WHITELIST = "";
  process.env.AI_GLOBAL_DAILY_CAP = "10000";

  for (let i = 0; i < 10; i++) {
    const ok = await aiGuard(makeReq("5.5.5.5"), "generate-form");
    assert(ok.allowed === true, `call ${i + 1}/10 should be allowed`);
  }
  const blocked = await aiGuard(makeReq("5.5.5.5"), "generate-form");
  assert(blocked.allowed === false, "11th call should be rate-limited");
  if (!blocked.allowed && "response" in blocked) {
    assert(blocked.response.status === 429, "rate-limit response should be 429");
    assert(
      blocked.response.headers.get("Retry-After") !== null,
      "rate-limit response should include Retry-After"
    );
  }
  // Other IPs should still work (independent per IP)
  const other = await aiGuard(makeReq("6.6.6.6"), "generate-form");
  assert(other.allowed === true, "other IP should not be affected");
  console.log("✓ per-IP rate-limit (10/24h)");

  // --- 4. Global daily cap ---
  __testing.reset();
  process.env.DEMO_MODE = "false";
  process.env.AI_IP_WHITELIST = "";
  process.env.AI_GLOBAL_DAILY_CAP = "3";

  // Use distinct IPs so per-IP rate-limit doesn't fire first.
  for (let i = 0; i < 3; i++) {
    const ok = await aiGuard(makeReq(`9.9.9.${i + 1}`), "generate-form");
    assert(ok.allowed === true, `global call ${i + 1}/3 should pass`);
  }
  const capped = await aiGuard(makeReq("9.9.9.99"), "generate-form");
  assert(capped.allowed === false, "4th global call should be capped");
  if (!capped.allowed && "response" in capped) {
    assert(capped.response.status === 503, "global cap response should be 503");
  }
  console.log("✓ global daily cap");

  console.log("\nAll guard tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
