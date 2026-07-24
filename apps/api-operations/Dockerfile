FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-operations/package.json ./apps/api-operations/

RUN npm ci --workspace=api-operations --include-workspace-root

COPY apps/api-operations/ ./apps/api-operations/

WORKDIR /app/apps/api-operations
CMD ["node", "index.js"]
