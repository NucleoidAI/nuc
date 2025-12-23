const config = {
  project: {
    name: "greycollar-api",
    version: "0.0.1",
    label: "Team",
    oauth: {
      jwt: {
        identifier: "id",
      },
      providers: {
        github: {
          tokenUrl: "https://github.com/login/oauth/access_token",
          userUrl: "https://api.github.com/user",
          clientId: "Ov23liDUwCkj5NPpApo7",
          userIdentifier: "id",
          userFields: {
            name: "login",
            displayName: "name",
            avatarUrl: "avatar_url",
            email: "email",
          },
        },
      },
    },
  },
  postgres: {
    uri: "sqlite::memory:",
    debug: true,
    sync: true,
  },
  dynamodb: {
    region: "us-east-1",
  },
  logger: {
    elasticsearch: {
      node: "http://98.88.24.46:9200",
      esVersion: 8,
      flushBytes: 1000,
      index: "greycollar-logs",
      consistency: "one",
    },
  },
  event: {
    type: "inMemory" as const,
    host: "98.88.24.46",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "pushgateway.land.greycollar.ai:443",
    pushGateway: {
      jobName: "greycollar-database",
      instance: "default",
    },
    pushGateWayOpenTelemetry: {
      jobName: "greycollar-opentelemetry",
      instance: "default",
    },
    pushGatewayNodeEvents: {
      jobName: "greycollar-api",
      instance: "node-events",
    },
  },
};

export default config;
