const config = {
  event: {
    type: "inMemory" as const,
    host: "inmemory",  
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://pushgateway:9091", 
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
};

export default config;