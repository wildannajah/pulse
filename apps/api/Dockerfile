FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile

RUN cd apps/api && npx prisma generate
RUN cd packages/types && npx tsc -p tsconfig.build.json
RUN cd apps/api && npx tsc -p tsconfig.build.json && echo "Build OK" && ls dist/

# ─────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma/ ./apps/api/prisma/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/apps/api/node_modules/ ./apps/api/node_modules/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
