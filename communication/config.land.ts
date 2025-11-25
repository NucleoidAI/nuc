const config = {
  event: {
    type: "inMemory" as const,
    host: "98.88.24.46",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://98.88.24.46:9091",
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
};

export default config;
