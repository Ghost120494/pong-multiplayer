FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 PUBLIC_DIR=/app/public PUPPY_DATA_DIR=/data
COPY --from=build --chown=node:node /app/dist/server.js ./dist/server.js
COPY --from=build --chown=node:node /app/public ./public
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8080
CMD ["node", "dist/server.js"]
