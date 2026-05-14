FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/ ./packages/
COPY apps/workers/ ./apps/workers/
COPY apps/api/prisma/ ./apps/api/prisma/
COPY apps/api/src/ ./apps/api/src/

RUN pnpm install --frozen-lockfile

RUN cd apps/workers && pnpm exec prisma generate --schema ../api/prisma/schema.prisma
RUN cd apps/workers && pnpm build && echo "Build OK" && ls dist/

# ─────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/workers/package.json ./apps/workers/package.json
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/apps/workers/node_modules/ ./apps/workers/node_modules/
COPY --from=builder /app/apps/workers/dist ./apps/workers/dist

ENV NODE_ENV=production

CMD ["node", "apps/workers/dist/main"]
