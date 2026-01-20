const config = {
  event: {
    type: "inMemory" as const,
    host: "inmemory",  // Changed from localhost
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://pushgateway:9091",  // Changed from localhost:9091
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
};

export default config;