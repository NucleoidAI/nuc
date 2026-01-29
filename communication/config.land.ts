const config = {
  event: {
    type: "inMemory" as const,
    host: "docker.greycollar.ai",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://docker.greycollar.ai:9091",
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
  socket: {
    transports: ["polling", "websocket"] as ("polling" | "websocket")[],
  },
};

export default config;
