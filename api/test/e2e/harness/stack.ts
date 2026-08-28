import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const API_DIR = process.cwd();
const REPO_ROOT = path.dirname(API_DIR);

type App = import("express").Express;

let current: App | undefined;

function app() {
  if (!current) {
    throw new Error("[e2e] the stack is not running; call stack.init() first");
  }

  return current;
}

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

async function startStack() {
  loadRootEnv();

  const jwtSecret = randomUUID();

  Object.assign(process.env, {
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

  await platform.getModules();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  current = require("../../../src/app").default as App;

  await models.init();

  const stop = async () => {
    current = undefined;
    await event.disconnect();
  };

  return { app: current, stop };
}

type Stack = Awaited<ReturnType<typeof startStack>>;

function init(timeoutMs = 180_000) {
  let running: Stack | undefined;

  beforeAll(async () => {
    running = await startStack();
  }, timeoutMs);

  afterAll(async () => {
    await running?.stop();
    running = undefined;
  });
}

const stack = { app, init, start: startStack };

export default stack;
export { startStack, app, REPO_ROOT };
export type { App, Stack };
