import type nucConfig from "../config";
import { event } from "@canmingir/link-express/event/client";
import models from "./models";
import platform from "@canmingir/link-express";

type Config = Pick<typeof nucConfig, "metrics">;

async function start({ metrics }: Config) {
  const logger = platform.logger;

  await models.init();

  const { default: mcpServer } = await import("./functions/mcpServer");
  const mcpEnv = await mcpServer.applyProcessEnv();

  mcpEnv.applied.forEach((entry) => logger.info(`MCP env override: ${entry}`));
  mcpEnv.skipped.forEach((entry) =>
    logger.warn(`MCP env override skipped, unknown server: ${entry}`)
  );

  if (metrics.enabled) {
    event.startPushgateway({
      url: metrics.url,
      jobName: metrics.pushGatewayNodeEvents.jobName,
      instance: metrics.pushGatewayNodeEvents.instance,
      interval: metrics.interval,
    });
  }
}

export type { Config };
export default start;
