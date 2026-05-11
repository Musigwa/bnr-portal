# Stage 1 — Prune
FROM node:22-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
RUN pnpm install -g turbo@^2
COPY . .
RUN turbo prune --scope=@bnr-portal/backend --docker

# Stage 2 — Build
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Configure PNPM home directory and add it to system PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable Corepack (built into Node) to activate pnpm instantly without global npm downloads
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Copy the lockfile and pruned workspace json files to cache dependency installation
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./

# Fetch dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

# Install offline
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -r --offline --ignore-scripts

# Copy the rest of the pruned source code
COPY --from=pruner /app/out/full/ .

# Generate Prisma Client manually now that the schema is copied
RUN pnpm --filter @bnr-portal/backend exec prisma generate

# Build the shared env package first so the backend can resolve it
RUN pnpm --filter @bnr-portal/env run build

# Build the backend and the standalone Prisma config
RUN pnpm --filter @bnr-portal/backend run build

# Deploy the backend and its production dependencies to an isolated folder
RUN pnpm deploy --filter @bnr-portal/backend --prod --legacy /app/deployed

# generate prisma client here so it lives in the out dir
RUN cd /app/deployed && pnpm prisma generate

# Stage 3 — Run
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Tell NestJS it is running inside a container and should not search for a .env file
ENV CONTAINER_ENV=true

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy isolated deployed app
COPY --from=builder /app/deployed ./
COPY --from=builder /app/backend/prisma.config.mjs ./prisma.config.mjs

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["node", "dist/main.js"]
