import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";

import ApiClient from "./client";
import SmtpSink from "./smtpSink";
import { ORDER_AGENT_ID, ORDER_BLUEPRINT_ID, TEAM_ID } from "../fixtures/ids";
import { isListening, startEventBus, waitForPort } from "./eventBus";

const API_DIR = process.cwd();
const REPO_ROOT = path.dirname(API_DIR);
const STAGE_DIR = path.join(REPO_ROOT, ".e2e");

const EVENT_PORT = 8080;
const API_PORT = Number(process.env.E2E_API_PORT || 4000);
const COMMUNICATION_PORT = Number(process.env.E2E_COMMUNICATION_PORT || 3001);

const APP_ID = "10b7bc8c-a49c-4002-b0ec-63599e4b5210";
const ORGANIZATION_ID = "dfb990bb-81dd-4584-82ce-050eb8f6a12f";

/**
 * Loads the repository's `.env.local`, the file `bun run dev` runs the stack
 * with. It deliberately overrides `api/.env`, which only holds checked-in
 * defaults. On CI there is no `.env.local`, so the workflow's own environment
 * is used as-is.
 */
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

/**
 * `bun test` runs with NODE_ENV=test, so Bun loads api/.env.test into this
 * process. Handing PROFILE=TEST to a service would make it fake its auth
 * sessions for a hard-coded team instead of honouring our token, so every
 * child gets an environment scrubbed of the test profile.
 */
function serviceEnv(overrides: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...overrides };

  delete env.PROFILE;
  delete env.PROJECT_ID;
  delete env.NODE_ENV;

  return env;
}

/**
 * Lays the API build out the way its Dockerfile does: `api/dist/*` becomes the
 * application root, with `mcp` as its sibling and the production
 * `node_modules` alongside. The config is supplied at staging time, exactly
 * like the deploy workflow's "Set config files" step — the build deliberately
 * leaves `config.ts` out.
 */
function stageApi() {
  const dist = path.join(API_DIR, "dist");

  if (!fs.existsSync(path.join(dist, "server.ts"))) {
    throw new Error(
      `No API build found at ${dist}. Run "bun run build" in api/ first.`
    );
  }

  const appDir = path.join(STAGE_DIR, "api");
  fs.mkdirSync(appDir, { recursive: true });
  fs.cpSync(dist, appDir, { recursive: true });

  for (const file of ["config.ts", "tsconfig.json"]) {
    fs.copyFileSync(path.join(API_DIR, file), path.join(appDir, file));
  }

  fs.symlinkSync(
    path.join(API_DIR, "node_modules"),
    path.join(appDir, "node_modules")
  );
  fs.symlinkSync(path.join(REPO_ROOT, "mcp"), path.join(STAGE_DIR, "mcp"));

  return appDir;
}

/** Same idea for the communication service: `bun dist/server.js`, as shipped. */
function stageCommunication() {
  const source = path.join(REPO_ROOT, "communication");
  const bundle = path.join(source, "dist", "server.js");

  if (!fs.existsSync(bundle)) return null;

  const appDir = path.join(STAGE_DIR, "communication");
  fs.mkdirSync(appDir, { recursive: true });
  // The whole dist goes over, plus the config the bundle still requires at
  // runtime — the deploy workflow swaps that per environment, exactly as it
  // does for the API.
  fs.cpSync(path.join(source, "dist"), appDir, { recursive: true });
  fs.copyFileSync(
    path.join(source, "config.ts"),
    path.join(appDir, "config.ts")
  );
  fs.symlinkSync(
    path.join(source, "node_modules"),
    path.join(appDir, "node_modules")
  );

  return appDir;
}

function signToken(secret: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jwt = require("jsonwebtoken");

  return jwt.sign(
    {
      sub: "1001",
      aud: TEAM_ID,
      rls: ["ADMIN"],
      aid: APP_ID,
      oid: ORGANIZATION_ID,
    },
    secret,
    { expiresIn: "6h" }
  );
}

async function waitForApi(client: ApiClient, child: ChildProcess) {
  const deadline = Date.now() + 120_000;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `The API exited with code ${
          child.exitCode
        } during startup; see ${path.join(STAGE_DIR, "api.log")}`
      );
    }

    try {
      // Answering both of these means the server is listening *and* the
      // platform's fire-and-forget seeding has landed — including the team
      // and agent rows every team-scoped route authorises against.
      await client.get(`/blueprints/${ORDER_BLUEPRINT_ID}`);
      await client.get(`/knowledge?agentId=${ORDER_AGENT_ID}`);
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `The API did not become ready within 120s (last error: ${
      lastError instanceof Error ? lastError.message : lastError
    }); see ${path.join(STAGE_DIR, "api.log")}`
  );
}

/**
 * Brings the backend up the way it runs in production — event bus, API and
 * communication service, each started through its own shipped entrypoint —
 * and hands back an authenticated client plus the mail sink standing in for
 * the mail provider.
 */
async function startStack() {
  loadRootEnv();

  const llm = process.env.PLATFORM_LLM;

  if (!llm || /^(mock|local)(\/|$)/i.test(llm)) {
    throw new Error(
      `The e2e suite runs against a real LLM. Set PLATFORM_LLM (currently "${
        llm ?? "unset"
      }") ` +
        `to a real provider, e.g. "openrouter/qwen3-next-80b-a3b-instruct", and provide its API key.`
    );
  }

  console.log(`[e2e] running the built artifacts against PLATFORM_LLM=${llm}`);

  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  fs.mkdirSync(STAGE_DIR, { recursive: true });

  const apiDir = stageApi();
  const communicationDir = stageCommunication();

  const smtp = new SmtpSink();
  const smtpPort = await smtp.listen();

  const eventBus = await startEventBus(EVENT_PORT);

  const jwtSecret = randomUUID();
  const children: ChildProcess[] = [];
  const logs: number[] = [];

  const spawnService = (
    name: string,
    command: string[],
    cwd: string,
    env: NodeJS.ProcessEnv
  ) => {
    const log = fs.openSync(path.join(STAGE_DIR, `${name}.log`), "a");
    logs.push(log);

    const child = spawn(command[0], command.slice(1), {
      cwd,
      stdio: ["ignore", log, log],
      env: serviceEnv(env),
    });

    children.push(child);

    return child;
  };

  const api = spawnService("api", ["bun", "server.ts"], apiDir, {
    PORT: String(API_PORT),
    JWT_SECRET: jwtSecret,
    INTERNAL_API_KEY: randomUUID(),
    API_BASE_URL: `http://127.0.0.1:${API_PORT}`,
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(smtpPort),
    SMTP_SECURE: "false",
    SMTP_IGNORE_TLS: "true",
    SMTP_REQUIRE_TLS: "false",
    SMTP_FROM: "e2e@greycollar.test",
    SMTP_USER: "",
    SMTP_PASS: "",
  });

  const client = new ApiClient(
    `http://127.0.0.1:${API_PORT}`,
    signToken(jwtSecret)
  );

  const stop = async () => {
    for (const child of children) {
      child.kill("SIGTERM");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (const child of children) {
      if (child.exitCode === null) child.kill("SIGKILL");
    }
    await smtp.close();
    await eventBus.stop();
    for (const log of logs) fs.closeSync(log);
  };

  try {
    await waitForApi(client, api);
    await startCommunication({
      appDir: communicationDir,
      jwtSecret,
      spawnService,
    });
  } catch (err) {
    await stop();
    throw err;
  }

  return { client, smtp, stageDir: STAGE_DIR, stop };
}

/**
 * The communication service only boots with real Slack credentials — Bolt
 * calls `auth.test` on start — so it is started when they are available and
 * skipped, loudly, when they are not. The order scenarios do not route through
 * it; it is up so the suite exercises the backend as it actually runs.
 */
async function startCommunication({
  appDir,
  jwtSecret,
  spawnService,
}: {
  appDir: string | null;
  jwtSecret: string;
  spawnService: (
    name: string,
    command: string[],
    cwd: string,
    env: NodeJS.ProcessEnv
  ) => ChildProcess;
}) {
  if (!appDir) {
    console.log(
      "[e2e] skipping the communication service: no build at communication/dist/server.js " +
        '(run "bun run build:communication")'
    );
    return;
  }

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.log(
      "[e2e] skipping the communication service: SLACK_BOT_TOKEN / SLACK_SIGNING_SECRET are not set"
    );
    return;
  }

  if (await isListening(COMMUNICATION_PORT)) {
    console.log(
      `[e2e] reusing the communication service already listening on ${COMMUNICATION_PORT}`
    );
    return;
  }

  const child = spawnService("communication", ["bun", "server.js"], appDir, {
    JWT_SECRET: jwtSecret,
    MAIN_PORT: String(COMMUNICATION_PORT),
    SLACK_PORT: String(COMMUNICATION_PORT + 1),
    SOCKET_IO_PORT: String(COMMUNICATION_PORT + 2),
    SWAGGER_PORT: String(COMMUNICATION_PORT + 3),
  });

  try {
    await waitForPort(COMMUNICATION_PORT, 60_000);
  } catch {
    throw new Error(
      `The communication service did not start (exit code ${
        child.exitCode
      }); see ${path.join(STAGE_DIR, "communication.log")}`
    );
  }
}

type Stack = Awaited<ReturnType<typeof startStack>>;

export { startStack, API_PORT, COMMUNICATION_PORT, REPO_ROOT, STAGE_DIR };
export type { Stack };
