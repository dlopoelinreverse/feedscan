# ---- Development stage ----
FROM node:20-alpine AS development

WORKDIR /app

# Native dependencies for @parcel/watcher on Alpine (ARM64)
RUN apk add --no-cache libc6-compat openssl

# Install bun for faster installs
RUN npm install -g bun

COPY package.json bun.lock* bun.lockb* package-lock.json* ./
RUN bun install

COPY . .

RUN bun run db:generate

EXPOSE 3000

CMD ["bun", "run", "dev"]

# ---- Builder stage ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lockb* package-lock.json* ./
RUN bun install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* vars must be available at build time for Next.js to inline them
ARG NEXT_PUBLIC_ROOT_DOMAIN
ARG NEXT_PUBLIC_AUTH_DOMAIN
ARG NEXT_PUBLIC_APP_DOMAIN
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG NEXT_PUBLIC_PORT

ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_AUTH_DOMAIN=$NEXT_PUBLIC_AUTH_DOMAIN
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ENV NEXT_PUBLIC_PORT=$NEXT_PUBLIC_PORT

RUN bun run db:generate
RUN bun run build

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
