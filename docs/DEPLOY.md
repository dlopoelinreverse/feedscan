# Deployment notes

Production runs on a VPS managed by Dokploy + Traefik. There is no Vercel
configuration — scheduled tasks are wired up via Dokploy (or system crontab).

## Required environment variables (Demo mode)

Set these in the Dokploy service environment (and locally in `.env`):

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service-role key from Supabase project settings
CRON_SECRET=<openssl rand -hex 32>      # shared secret for the cleanup cron
```

`NEXT_PUBLIC_ROOT_DOMAIN` must already be set — the existing Supabase helpers
use it as the cookie domain (with a leading dot) for cross-subdomain sessions.

## Database migration

The schema adds two columns and an index on `User`:

```
isDemo     Boolean   @default(false)
expiresAt  DateTime?
@@index([isDemo, expiresAt])
```

Apply against the prod DB manually:

```bash
cd web
bunx prisma db push
```

## Scheduled tasks (demo cleanup)

The route `GET /api/cron/cleanup-demo` deletes expired demo accounts
(`isDemo = true AND expiresAt < now`). It requires
`Authorization: Bearer $CRON_SECRET` and returns `{ deleted: N }`.

Pick one of the two options below.

### Option A — Dokploy Schedules (recommended)

In the Dokploy UI → project **feedscan** → tab **Schedules** → add:

- **Name**: `cleanup-demo-accounts`
- **Schedule (cron)**: `0 * * * *` (every hour)
- **Command**:
  ```
  curl -sf -H "Authorization: Bearer $CRON_SECRET" https://app.feed-scan.leopoldev.com/api/cron/cleanup-demo
  ```

Dokploy injects the service env vars, so `$CRON_SECRET` resolves automatically.

### Option B — System crontab on the VPS

```
0 * * * * curl -sf -H "Authorization: Bearer <CRON_SECRET_VALUE>" https://app.feed-scan.leopoldev.com/api/cron/cleanup-demo >> /var/log/feedscan-cron.log 2>&1
```

Replace `<CRON_SECRET_VALUE>` with the literal secret — system crontab does
not read your service env vars.

## Smoke test

```bash
# 401 expected (no header)
curl -i https://app.feed-scan.leopoldev.com/api/cron/cleanup-demo

# {"deleted": N} expected
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://app.feed-scan.leopoldev.com/api/cron/cleanup-demo
```
