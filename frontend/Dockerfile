# Stage 1 — Prune
FROM node:22-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
RUN pnpm install -g turbo@^2
COPY . .
RUN turbo prune --scope=@bnr-portal/frontend --docker

# Stage 2 — Build
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Configure PNPM home directory and add it to system PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
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

ARG DOMAIN_ROOT
ARG APP_NAME
ENV NEXT_PUBLIC_API_URL=https://api.${APP_NAME}.${DOMAIN_ROOT}

# Build the shared env package first so the frontend can resolve it
RUN pnpm --filter @bnr-portal/env run build

# Build the frontend
RUN pnpm --filter @bnr-portal/frontend run build

# Deploy the frontend and its production dependencies to an isolated folder
RUN pnpm deploy --filter @bnr-portal/frontend --prod --legacy /app/deployed

# Stage 3 — Run
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy isolated deployed app
COPY --from=builder /app/deployed ./

RUN chown -R appuser:appgroup /app

USER appuser

# Run the raw Next.js binary directly to safely bypass local-dev package.json wrappers
CMD ["sh", "-c", "node_modules/.bin/next start -p ${NEXT_FRONTEND_PORT}"]
