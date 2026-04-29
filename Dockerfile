FROM oven/bun:1

RUN apt-get update && apt-get install -y \
    ca-certificates \
    procps \
    chromium \
    chromium-sandbox \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json bun.lock ./
COPY server.ts .
COPY ./dashboard/dist ./dist
COPY ./dashboard/dist/config.land.js ./dist/config.js
COPY ./dashboard/config.js ./config.mjs
COPY ./api/package.json ./api/package.json
COPY ./api/bun.lock ./api/bun.lock
COPY ./api/tsconfig.json ./api/tsconfig.json
COPY ./api/dist/ ./api/
COPY ./mcp ./mcp

RUN bun install --production --ignore-scripts
RUN cd api && bun install --production

EXPOSE 3000

ENTRYPOINT ["bun", "run", "serve"]