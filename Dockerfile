FROM node:20-alpine
WORKDIR /app
COPY dist/server.js ./server.js
COPY public ./public
ENV NODE_ENV=production PORT=8080 PUBLIC_DIR=/app/public
EXPOSE 8080
CMD ["node","server.js"]
