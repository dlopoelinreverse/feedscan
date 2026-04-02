# ---- Development stage ----
FROM node:20-alpine AS development

WORKDIR /app

# Native dependencies for @parcel/watcher on Alpine (ARM64)
RUN apk add --no-cache libc6-compat

# Install bun for faster installs
RUN npm install -g bun

COPY package.json bun.lock* bun.lockb* package-lock.json* ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]

# ---- Builder stage ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lockb* package-lock.json* ./
RUN bun install --frozen-lockfile

COPY . .

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
