FROM node:20-alpine

ARG GIT_SHA=local
ENV GIT_SHA=$GIT_SHA

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "test:db"]
