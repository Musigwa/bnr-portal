FROM node:20-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
RUN pnpm install -g turbo@^2
COPY . .
RUN turbo prune --scope=@bnr-portal/backend --docker

# Stage 2 — Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Configure PNPM home directory and add it to system PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable Corepack (built into Node) to activate pnpm instantly without global npm downloads
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Copy pruned workspace json files to cache dependency installation
COPY --from=pruner /app/out/json/ .

# Fetch dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

# Copy the lockfile and install offline
COPY --from=pruner /app/out/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -r --offline

# Copy the rest of the pruned source code
COPY --from=pruner /app/out/full/ .

# Build the backend and the standalone Prisma config
RUN pnpm --filter @bnr-portal/backend run build

# Deploy the backend and its production dependencies to an isolated folder
RUN pnpm deploy --filter @bnr-portal/backend --prod --legacy /app/out

# generate prisma client here so it lives in the out dir
RUN cd /app/out && pnpm prisma generate

# Stage 2 — Run
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy isolated deployed app
COPY --from=builder /app/out ./
COPY --from=builder /app/backend/prisma.config.js ./prisma.config.js

RUN mkdir -p uploads && chown -R appuser:appgroup /app

USER appuser

CMD ["npm", "run", "start"]
