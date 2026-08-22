FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-supplier/package.json ./apps/api-supplier/

RUN npm ci --workspace=api-supplier --include-workspace-root

COPY apps/api-supplier/ ./apps/api-supplier/

WORKDIR /app/apps/api-supplier
CMD ["node", "index.js"]
