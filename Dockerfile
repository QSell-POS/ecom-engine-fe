# syntax=docker/dockerfile:1

# Next.js 16 standalone build. Three stages so the final image carries no
# package manager cache, no dev dependencies and no source.
FROM node:22-alpine AS deps
WORKDIR /app
# libc6-compat: some native deps (sharp's prebuilds) expect glibc symbols.
RUN apk add --no-cache libc6-compat
# The lockfile is tracked but .gitignore also lists it, so a future `git rm`
# would silently break deploys — fall back rather than fail the build.
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else echo "No lockfile; builds are not reproducible." && npm install; fi

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# they arrive as build args rather than runtime env.
ARG NEXT_PUBLIC_DEFAULT_CURRENCY=NPR
ARG NEXT_PUBLIC_API_URL
# Host routing: which domain is the dashboard, and which store the shop serves.
ARG NEXT_PUBLIC_ADMIN_DOMAIN
ARG NEXT_PUBLIC_STORE_SLUG
ARG NEXT_PUBLIC_STORE_NAME
ENV NEXT_PUBLIC_DEFAULT_CURRENCY=$NEXT_PUBLIC_DEFAULT_CURRENCY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_DOMAIN=$NEXT_PUBLIC_ADMIN_DOMAIN
ENV NEXT_PUBLIC_STORE_SLUG=$NEXT_PUBLIC_STORE_SLUG
ENV NEXT_PUBLIC_STORE_NAME=$NEXT_PUBLIC_STORE_NAME
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user that owns nothing it does not need to write.
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# server.js does not serve public/ or .next/static unless they are copied in.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# The app has a page at /login that renders without the API; a request for it
# proves the server is up without depending on the backend being reachable.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
