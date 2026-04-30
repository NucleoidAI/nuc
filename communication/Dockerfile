FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY dist ./dist

EXPOSE 3000

ENTRYPOINT ["bun", "dist/server.js"]