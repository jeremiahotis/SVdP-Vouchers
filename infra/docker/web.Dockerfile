FROM node:20-alpine AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile --filter ./packages/contracts --filter ./apps/web

COPY packages/contracts packages/contracts
COPY apps/web apps/web

RUN pnpm -C packages/contracts build
RUN pnpm -C apps/web build

EXPOSE 3000

CMD ["pnpm", "-C", "apps/web", "start"]
