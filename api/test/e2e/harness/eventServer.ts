import net from "node:net";
import { spawn, type ChildProcess } from "node:child_process";

const SERVER_ENTRY = require.resolve("@canmingir/link-express/event/server");

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close(() => reject(new Error("Could not determine event port")));
        return;
      }
      probe.close(() => resolve(address.port));
    });
  });
}

async function waitForListener(port: number) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    const connected = await new Promise<boolean>((resolve) => {
      const socket = net
        .connect({ host: "127.0.0.1", port })
        .once("connect", () => socket.end(() => resolve(true)))
        .once("error", () => resolve(false));
    });

    if (connected) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Event server did not start on port ${port}`);
}

async function startEventServer() {
  const port = await freePort();
  const child: ChildProcess = spawn(process.execPath, [SERVER_ENTRY], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "inherit"],
  });

  await waitForListener(port);

  return {
    port,
    stop: async () => {
      if (child.exitCode !== null) return;
      await new Promise<void>((resolve) => {
        const forceKill = setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 3_000);
        forceKill.unref();

        child.once("exit", () => {
          clearTimeout(forceKill);
          resolve();
        });
        child.kill("SIGTERM");
      });
    },
  };
}

export { startEventServer };
