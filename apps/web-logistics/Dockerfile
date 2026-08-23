FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_ADMIN_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web-logistics/package.json ./apps/web-logistics/

RUN npm ci --workspace=web-logistics --include-workspace-root

COPY apps/web-logistics/ ./apps/web-logistics/

RUN npm run build --workspace=web-logistics

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web-logistics/dist /usr/share/nginx/html
EXPOSE 80
