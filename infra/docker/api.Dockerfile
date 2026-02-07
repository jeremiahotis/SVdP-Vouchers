FROM node:20-alpine AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile --filter ./packages/contracts --filter ./apps/api

COPY packages/contracts packages/contracts
COPY apps/api apps/api

RUN pnpm -C packages/contracts build
RUN pnpm -C apps/api build

EXPOSE 3001

CMD ["node", "apps/api/dist/src/main.js"]
