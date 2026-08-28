import "./src/instrumentation";

import config from "./config";
import dotenv from "dotenv";
import { event } from "@canmingir/link-express/event/client";
import http from "http";
import models from "./src/models";
import platform from "@canmingir/link-express";

dotenv.config();

process.on("uncaughtException", (err) => {
  platform.logger.error({
    message: "Uncaught Exception",
    error_message: err.message,
    error_stack: err.stack,
  });
});

process.on("unhandledRejection", (reason, promise) => {
  platform.logger.error("==========================================");
  platform.logger.error(reason);
  platform.logger.error(promise);
  if (reason instanceof Error) {
    platform.logger.error(reason.stack);
  }
  platform.logger.error("==========================================");
});

platform.init(config).then(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const app = require("./src/app").default;

  const server = http.createServer(app);

  await event.init(config.event);

  const shutdown = async () => {
    await event.disconnect();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const logger = platform.logger;

  logger.info("Platform Logger Initialized");

  await models.init();

  if (config.metrics.enabled) {
    event.startPushgateway({
      url: config.metrics.url,
      jobName: config.metrics.pushGatewayNodeEvents.jobName,
      instance: config.metrics.pushGatewayNodeEvents.instance,
      interval: config.metrics.interval,
    });
  }

  server.listen(process.env.PORT || 4000, () => {
    logger.info(`Server is running on port ${process.env.PORT || 4000}`);
  });
});
