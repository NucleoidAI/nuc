const config = {
  project: {
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
    sync: false,
  },
  dynamodb: {
    region: "us-east-1",
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
    url: "http://98.88.24.46:9091",
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
