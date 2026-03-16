FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build || true

EXPOSE 5000

USER node

CMD ["dumb-init", "node", "server.js"]