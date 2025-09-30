FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for entire monorepo
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages/db first
WORKDIR /app/packages/db
RUN npm run build

# Build API
WORKDIR /app/apps/api
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application and dependencies
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=fastify:nodejs /app/packages/db/dist ./node_modules/@health-heatmap/db/dist
COPY --from=builder --chown=fastify:nodejs /app/packages/db/drizzle ./node_modules/@health-heatmap/db/drizzle

USER fastify

EXPOSE 4000

ENV PORT=4000

# Run migrations then start server
CMD sh -c "npm run db:migrate && node dist/index.js"