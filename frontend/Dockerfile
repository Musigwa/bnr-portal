# Stage 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Configure PNPM home directory and add it to system PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Fetch dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

# Copy workspace source
COPY . .

# Install dependencies offline
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -r --offline

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
