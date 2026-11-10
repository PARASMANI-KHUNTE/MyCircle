FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# The image runs both the HTTP server (default CMD) and the queue worker
# (docker-compose overrides command); the HTTP healthcheck therefore lives in
# docker-compose.yml on the server service only.

EXPOSE 5000

USER node

CMD ["dumb-init", "node", "server.js"]
