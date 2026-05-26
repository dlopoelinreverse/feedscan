# FeedScan

QR-code customer feedback for physical businesses.

FeedScan lets restaurants, salons, clinics, and other customer-facing businesses collect structured feedback at the point of service. Owners build a short form, generate QR codes for tables, receipts, or counters, and watch responses arrive in a dashboard. An AI wizard tailored to Quebec hospitality and service sectors helps build forms that ask the right questions rather than generic ones like "How was your service?".

**Live demo:** https://feed-scan.leopoldev.com

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS · shadcn/ui (Radix UI primitives)
- TanStack Form · @dnd-kit (sortable form builder)
- Recharts (analytics) · next-intl (FR/EN i18n)

**Backend**
- Next.js API routes (Node runtime)
- PostgreSQL via Supabase · Prisma ORM
- Supabase Auth (`@supabase/ssr`, cross-subdomain cookies)
- Anthropic SDK (Claude) · Zod schemas
- Stripe SDK (subscriptions + webhooks + Customer Portal)

**Infra**
- Multi-stage Docker (Alpine, standalone Next build)
- Bun as package manager, Prisma as migration runner
- Deployed on a VPS via Dokploy + Traefik

---

## Key Features

- **Form builder** — drag-and-drop questions (stars / emoji / choice / text), conditional follow-ups triggered by low/high ratings, per-form rate limiting (per session / per 24h / per week / custom).
- **AI form generation** — describe your business in plain language; Claude analyzes the sector, proposes 8–12 concrete customer-journey "angles" (e.g. *"time between sitting down and first order taken"* rather than *"service quality"*), then generates a complete bilingual form. Wizard supports refinement and FR↔EN translation in one call.
- **QR code distribution** — generate as many uniquely-tracked QR codes as needed per form (one per table, per location, per campaign), each with its own scan counter.
- **Public response flow** — branded form rendered on a public route, visitor fingerprinting for rate-limit enforcement without forcing accounts.
- **Theming** — per-business themes with color palette, fonts, and radius; rendered via CSS custom properties so previews are pixel-accurate.
- **Subscriptions** — Free / Pro / Business plans, Stripe Checkout + Customer Portal, server-side enforcement of plan limits (forms, monthly responses, AI generations).
- **i18n** — full FR/EN coverage with bilingual data model and a CI guard against missing translation keys.
- **Demo mode** — one-click demo account provisioned end-to-end (Stripe test subscription included), auto-cleaned up by an hourly cron.

---

## Architecture Highlights

### Three-host routing via a custom Next.js proxy
The app runs across three subdomains — `feedscan.<tld>` (marketing + public forms), `auth.<tld>` (login/register/onboarding), `app.<tld>` (dashboard + API). A single `src/proxy.ts` middleware handles cross-subdomain redirects while preserving Supabase auth cookies through 30x responses. Localhost falls back to single-origin mode so dev never needs a hosts file or a tunnel.

### AI cost protection at the edge
`/api/ai/**` routes are public-internet-facing on a free demo, which is an obvious target for cost abuse. `src/lib/ai/guard.ts` enforces three layers before any Anthropic call:
- per-IP rate limit (rolling 24h window, in-memory),
- global daily cap (returns 503 when reached),
- `DEMO_MODE` flag that swaps real calls for static JSON fixtures.

An `AI_IP_WHITELIST` env var lets the owner bypass everything. Single-process design is intentional — a restart resets state, which is acceptable here and avoids a Redis dependency.

### Defensive Stripe sync
Stripe webhooks are the source of truth, but they can lag a few seconds after Checkout. The settings page re-reads the Checkout Session on the success redirect and reconciles the user row if the webhook hasn't landed yet (`src/lib/billing-sync.ts`). Idempotent, demo-aware (`isDemo` accounts are never overwritten by any Stripe event), and resilient to webhook outages.

### Bilingual by data model, not by templating
Every user-facing string in the data layer has dedicated `*Fr` and `*En` columns (Form, Question, FollowUpRule). The AI generates both languages in a single call. Translation is a real data operation, not a runtime overlay — which means SEO, plaintext search, and exports all just work in either language.

### AI prompts as encoded domain expertise
The Claude prompts in `src/lib/ai/prompts.ts` aren't generic "act as a UX expert" templates. They encode specific quality bars with good-vs-bad examples per sector (restaurant, hair salon, dental clinic), enforce JSON-only output without code fences, and require every angle to be answerable on a 1–5 scale by an actual customer. The schema is enforced with Zod on the response side.

---

## Getting Started

### Prerequisites
- Docker + Docker Compose, **or** Node 20+ with [Bun](https://bun.sh/)
- A Supabase project (URL + publishable key + service-role key)
- A Stripe account in test mode (see `web/STRIPE_SETUP.md`)
- An Anthropic API key

### Setup
Clone and create your local environment file:

```bash
git clone <repo-url> feedscan
cd feedscan
cp .env.example .env
```

Then fill in `.env` with your Supabase, Stripe, Anthropic, and domain values.

### Run with Docker (recommended)

```bash
npm run dev
```

This runs `docker compose up`, which builds the dev image, applies the Prisma schema, then starts `next dev`. The app is served at `http://localhost:3001` (or whatever `NEXT_PUBLIC_PORT` you set).

### Run natively

```bash
cd web
bun install
bun run db:generate
bunx prisma db push
bun run dev
```

### Useful scripts (from `web/`)

Check FR/EN translation key parity:

```bash
bun run check:i18n:all
```

Open Prisma Studio:

```bash
bun run db:studio
```

Forward Stripe events to the local dev server:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

---

## Deployment

Production is a VPS managed by Dokploy + Traefik (no Vercel). The production Docker stage produces a Next standalone build that runs `prisma db push` at startup — without `--accept-data-loss`, so destructive schema changes fail-fast instead of silently dropping data.

Scheduled work (hourly demo-account cleanup) is wired through Dokploy Schedules; the cron endpoint is gated by a shared bearer secret. See `docs/DEPLOY.md` for the full deploy + cron setup.

---

## Roadmap

- **Automated tests** — Vitest for unit/integration coverage on the form engine, plan-limit logic, and AI guard; Playwright for end-to-end flows (signup → form creation → public response → Stripe Checkout).
- **CI pipeline** — GitHub Actions running typecheck, lint, i18n key parity, and a production build on every PR before merge.
- **Observability** — structured logging and error tracking (Sentry or equivalent) for the AI and Stripe-webhook paths, where silent failures are the most expensive.
