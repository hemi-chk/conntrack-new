FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_OPERATIONS_URL
ARG VITE_SUPPLIER_URL
ARG VITE_LOGISTICS_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OPERATIONS_URL=$VITE_OPERATIONS_URL
ENV VITE_SUPPLIER_URL=$VITE_SUPPLIER_URL
ENV VITE_LOGISTICS_URL=$VITE_LOGISTICS_URL

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web-admin/package.json ./apps/web-admin/

RUN npm ci --workspace=web-admin --include-workspace-root

COPY apps/web-admin/ ./apps/web-admin/

RUN npm run build --workspace=web-admin

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web-admin/dist /usr/share/nginx/html
EXPOSE 80
