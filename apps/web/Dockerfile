FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --filter ./packages/contracts --filter ./apps/web

COPY packages/contracts packages/contracts
COPY apps/web apps/web

RUN pnpm -C apps/web build

EXPOSE 3000

CMD ["pnpm", "-C", "apps/web", "start"]
