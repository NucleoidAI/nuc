const config = {
  project: {
    name: "mcp.greycollar.ai",
    version: "1.0.0",
  },
  logger: {
    elasticsearch: {
      node: "http://docker.greycollar.ai:9200",
      esVersion: Number(process.env.ELASTICSEARCH_VERSION) || 8,
      flushBytes: Number(process.env.ELASTICSEARCH_FLUSH_BYTES) || 1000,
      index: process.env.ELASTICSEARCH_INDEX || "greycollar-mcp-logs",
    },
  },
};

export function getConfig() {
  return config;
}
