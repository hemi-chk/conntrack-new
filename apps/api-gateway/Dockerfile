FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-gateway/package.json ./apps/api-gateway/

RUN npm ci --workspace=api-gateway --include-workspace-root

COPY apps/api-gateway/ ./apps/api-gateway/

WORKDIR /app/apps/api-gateway
CMD ["node", "index.js"]
