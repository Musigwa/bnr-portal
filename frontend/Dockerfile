FROM node:20-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
RUN pnpm install -g turbo@^2
COPY . .
RUN turbo prune --scope=@bnr-portal/frontend --docker

# Stage 2 — Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Configure PNPM home directory and add it to system PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Copy pruned workspace json files to cache dependency installation
COPY --from=pruner /app/out/json/ .

# Fetch dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

# Copy the lockfile and install offline
COPY --from=pruner /app/out/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -r --offline --ignore-scripts

# Copy the rest of the pruned source code
COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the frontend
RUN pnpm --filter @bnr-portal/frontend run build

# Stage 2 — Run
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy standalone output and static files
# The standalone output preserves the workspace folder structure (e.g. /app/frontend/)
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

RUN chown -R appuser:appgroup /app

USER appuser

# Run the server.js created by next build standalone inside the workspace folder
CMD ["node", "frontend/server.js"]
