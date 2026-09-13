FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-driver/package.json ./apps/api-driver/

RUN npm ci --workspace=api-driver --include-workspace-root

COPY apps/api-driver/ ./apps/api-driver/

WORKDIR /app/apps/api-driver
CMD ["node", "index.js"]
