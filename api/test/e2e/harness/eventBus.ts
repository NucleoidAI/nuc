import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

const EVENT_SERVER_BIN = path.join(
  process.cwd(),
  "node_modules",
  "@canmingir",
  "link-express",
  "bin",
  "cli.js"
);

async function isListening(port: number, host = "127.0.0.1") {
  return await new Promise<boolean>((resolve) => {
    const socket = net.connect({ port, host });
    const done = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(500);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function waitForPort(port: number, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isListening(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Event server did not start on port ${port}`);
}

/**
 * The API talks to the event bus over a socket, so the suite needs a listener.
 * Reuses one that is already up (a running `bun run dev`), otherwise spawns it
 * and shuts it down again afterwards.
 */
async function startEventBus(port: number) {
  if (await isListening(port)) {
    return { stop: async () => {} };
  }

  const child: ChildProcess = spawn(
    "bun",
    [EVENT_SERVER_BIN, "start", "-p", String(port)],
    { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env } }
  );

  await waitForPort(port);

  return {
    stop: async () => {
      child.kill("SIGTERM");
    },
  };
}

export { startEventBus, isListening, waitForPort };
