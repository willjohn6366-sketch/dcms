FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=6100 \
    DB_DIALECT=sqlite \
    DB_STORAGE=/app/data/database/circuit_management.sqlite \
    BACKUP_DIR=/app/data/backups

COPY version.json ./version.json
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/src ./src
COPY backend/scripts ./scripts

RUN mkdir -p /app/data/database /app/data/backups

EXPOSE 6100

CMD ["node", "src/app.js"]
