const config = {
  project: {
    name: "nuc-api",
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
    uri: "sqlite:///:memory:",
    debug: true,
    sync: true,
  },
  dynamodb: {
    region: "us-east-1",
  },
  logger: {
    elasticsearch: {
      node: "http://docker.greycollar.ai:9200",
      esVersion: 8,
      flushBytes: 50000,
      index: "nuc-logs",
      consistency: "one",
    },
  },
  event: {
    type: "inMemory" as const,
    host: "docker.greycollar.ai",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "https://pushgateway.land.greycollar.ai",
    pushGateway: {
      jobName: "nuc-database",
      instance: "default",
    },
    pushGateWayOpenTelemetry: {
      jobName: "nuc-opentelemetry",
      instance: "default",
    },
    pushGatewayNodeEvents: {
      jobName: "nuc-api",
      instance: "node-events",
    },
  },
};

export default config;
