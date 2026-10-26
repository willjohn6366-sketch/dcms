FROM node:22-alpine

RUN apk add --no-cache git docker-cli docker-cli-compose

WORKDIR /updater
COPY updater/server.js ./server.js

CMD ["node", "server.js"]
