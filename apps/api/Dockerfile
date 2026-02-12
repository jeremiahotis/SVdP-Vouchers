FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --filter ./packages/contracts --filter ./apps/api

COPY packages/contracts packages/contracts
COPY apps/api apps/api

RUN pnpm -C apps/api build

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
