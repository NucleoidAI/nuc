import { ecsFormat } from "@elastic/ecs-pino-format";
import pino from "pino";
import pinoElastic from "pino-elasticsearch";

const streams: pino.StreamEntry[] = [{ stream: process.stderr }];

if (process.env.ELASTICSEARCH_NODE) {
  const streamToElastic = pinoElastic({
    index: "greycollar-mcp-logs",
    node: process.env.ELASTICSEARCH_NODE,
    esVersion: 8,
    flushBytes: 1000,
  } as Parameters<typeof pinoElastic>[0]);
  streams.push({ stream: streamToElastic });
}

const logger = pino(
  {
    ...ecsFormat(),
    base: {
      service: {
        name: "mcp.greycollar.ai",
        version: "1.0.0",
      },
    },
  },
  pino.multistream(streams)
);

export default logger;
