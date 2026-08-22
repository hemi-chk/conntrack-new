FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-auth/package.json ./apps/api-auth/

RUN npm ci --workspace=api-auth --include-workspace-root

COPY apps/api-auth/ ./apps/api-auth/

WORKDIR /app/apps/api-auth
CMD ["node", "index.js"]
