FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-admin/package.json ./apps/api-admin/

RUN npm ci --workspace=api-admin --include-workspace-root

COPY apps/api-admin/ ./apps/api-admin/

WORKDIR /app/apps/api-admin
CMD ["node", "index.js"]
