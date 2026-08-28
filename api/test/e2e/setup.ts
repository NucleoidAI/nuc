import dotenv from "dotenv";
import path from "node:path";
import { randomUUID } from "node:crypto";

const REPO_ROOT = path.dirname(process.cwd());

beforeAll(async () => {
  dotenv.config({
    path: path.join(REPO_ROOT, ".env.local"),
    override: true,
    quiet: true,
  });

  Object.assign(process.env, {
    JWT_SECRET: randomUUID(),
    SMTP_FROM: "e2e@greycollar.test",
  });

  /* eslint-disable @typescript-eslint/no-var-requires */
  const config = require("../../config").default;
  const platform = require("@canmingir/link-express").default;
  const models = require("../../src/models").default;
  const { event } = require("@canmingir/link-express/event/client");
  /* eslint-enable @typescript-eslint/no-var-requires */

  await platform.init(config);

  await event.init(config.event);

  await platform.getModules();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.app = require("../../src/app").default;

  await models.init();
}, 180_000);

afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { event } = require("@canmingir/link-express/event/client");

  globalThis.app = undefined as never;

  await event.disconnect();
});
