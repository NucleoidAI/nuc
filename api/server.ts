import "./src/instrumentation";

import config from "./config";
import dotenv from "dotenv";
import { event } from "@canmingir/link-express/event/client";
import http from "http";
import models from "./src/models";
import platform from "@canmingir/link-express";

//import kafkaConfig from "./config.kafka";
//import txqConfig from "./config.txq";

dotenv.config();

process.on("uncaughtException", (err) => {
  platform.logger.error(`Uncaught Exception: ${err.message}`);
});

process.on("unhandledRejection", (reason, promise) => {
  platform.logger.error("==========================================");
  platform.logger.error("Unhandled Rejection:", reason);
  platform.logger.error("Promise:", promise);
  if (reason instanceof Error) {
    platform.logger.error("Stack:", reason.stack);
  }
  platform.logger.error("==========================================");
});

platform.init(config).then(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const app = require("./src/app").default;
  const server = http.createServer(app);

  await event.init(config.event);

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
