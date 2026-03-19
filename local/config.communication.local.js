const config = {
  event: {
    type: "inMemory",
    host: "inmemory",
    protocol: "http",
    port: 8080,
  },
  metrics: {
    enabled: false,
    interval: 15000,
    url: "http://pushgateway:9091",
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
  socket: {
    transports: ["polling"],
  },
};

module.exports = config;
