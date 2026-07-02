FROM node:22-alpine AS build

WORKDIR /app/mobile-uni

COPY mobile-uni/package*.json ./
RUN npm ci

COPY mobile-uni/index.html ./
COPY mobile-uni/tsconfig.json ./
COPY mobile-uni/vite.config.ts ./
COPY mobile-uni/shims-uni.d.ts ./
COPY mobile-uni/src ./src

RUN npm run build:h5

FROM nginx:1.27-alpine

COPY mobile-uni/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/mobile-uni/dist/build/h5 /usr/share/nginx/html

EXPOSE 80
