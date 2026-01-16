const config = {
  event: {
    type: "inMemory" as const,
    host: "10.98.228.27",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://10.98.228.27:9091",
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
};

export default config;
