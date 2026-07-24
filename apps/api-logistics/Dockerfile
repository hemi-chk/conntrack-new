FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-logistics/package.json ./apps/api-logistics/

RUN npm ci --workspace=api-logistics --include-workspace-root

COPY apps/api-logistics/ ./apps/api-logistics/

WORKDIR /app/apps/api-logistics
CMD ["node", "index.js"]
