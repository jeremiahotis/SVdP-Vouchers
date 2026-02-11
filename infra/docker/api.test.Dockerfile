# syntax=docker/dockerfile:1.7
FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/api apps/api
COPY apps/web/lib apps/web/lib
COPY tests tests
COPY docs/RELEASE_GATES.md docs/RELEASE_GATES.md
COPY .github/workflows .github/workflows

RUN pnpm -C packages/contracts build

CMD ["pnpm", "test:tenant"]
