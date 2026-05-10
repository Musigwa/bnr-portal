# Stage 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY src/utils/db-url.generator.ts ./src/utils/db-url.generator.ts
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN npx esbuild prisma.config.ts --bundle --platform=node --format=cjs --outfile=prisma.config.js --footer:js="module.exports = module.exports.default || module.exports;"
RUN pnpm prune --prod

# Stage 2 — Run
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js

RUN mkdir -p uploads && chown -R appuser:appgroup /app

USER appuser

CMD ["npm", "run", "start"]
