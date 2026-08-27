import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";

const API_DIR = process.cwd();
const REPO_ROOT = path.dirname(API_DIR);

const API_PORT = Number(process.env.E2E_API_PORT || 4000);

function loadRootEnv() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, rawValue] = match;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

async function waitForSeed(sequelize: any, timeoutMs = 60_000) {
  const seedDir = path.join(API_DIR, "src", "seeds");

  const expected = fs
    .readdirSync(seedDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const name = file.replace(/\.json$/, "");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { seed } = require(path.join(seedDir, file));
      return { name, rows: Array.isArray(seed) ? seed.length : 0 };
    })
    .filter(({ name, rows }) => rows > 0 && sequelize.models[name]);

  const deadline = Date.now() + timeoutMs;
  let pending = expected;

  while (Date.now() < deadline) {
    const counts = await Promise.all(
      pending.map(async ({ name, rows }) => {
        try {
          return (await sequelize.models[name].count()) >= rows;
        } catch {
          return false;
        }
      }),
    );

    pending = pending.filter((_, index) => !counts[index]);

    if (!pending.length) return;

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(
    `[e2e] timed out waiting for the seed data: ${pending
      .map(({ name }) => name)
      .join(", ")}`,
  );
}

async function startStack() {
  loadRootEnv();

  const llm = process.env.PLATFORM_LLM;

  if (!llm || /^(mock|local)(\/|$)/i.test(llm)) {
    throw new Error(
      `The e2e suite runs against a real LLM. Set PLATFORM_LLM (currently "${
        llm ?? "unset"
      }") ` +
        `to a real provider, e.g. "openrouter/qwen3-next-80b-a3b-instruct", and provide its API key.`,
    );
  }

  console.log(`[e2e] running the API in-process against PLATFORM_LLM=${llm}`);

  const jwtSecret = randomUUID();

  Object.assign(process.env, {
    PORT: String(API_PORT),
    JWT_SECRET: jwtSecret,
    SMTP_FROM: "e2e@greycollar.test",
  });

  /* eslint-disable @typescript-eslint/no-var-requires */
  const config = require("../../../config").default;
  const platform = require("@canmingir/link-express").default;
  const models = require("../../../src/models").default;
  const { event } = require("@canmingir/link-express/event/client");
  /* eslint-enable @typescript-eslint/no-var-requires */

  await platform.init(config);

  await event.init(config.event);

  const {
    Postgres: { sequelize },
  } = await platform.getModules();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const app = require("../../../src/app").default;

  const server = http.createServer(app);

  await models.init();

  await waitForSeed(sequelize);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(API_PORT, "127.0.0.1", resolve);
  });

  const stop = async () => {
    await event.disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };

  return { stop };
}

type Stack = Awaited<ReturnType<typeof startStack>>;

export { startStack, API_PORT, REPO_ROOT };
export type { Stack };
