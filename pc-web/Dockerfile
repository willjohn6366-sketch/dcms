FROM node:22-alpine AS build

WORKDIR /app

COPY version.json ./version.json

WORKDIR /app/pc-web

COPY pc-web/package*.json ./
RUN npm ci

COPY pc-web/index.html ./
COPY pc-web/tsconfig*.json ./
COPY pc-web/vite.config.ts ./
COPY pc-web/src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
