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
          clientId: "Ov23lihgDzlqJ1gnZxX3",
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
    debug: false,
    sync: true,
  },
  dynamodb: {
    region: "us-east-1",
  },
  event: {
    type: "inMemory" as const,
    host: "localhost",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: false,
    interval: 15000,
    url: "http://localhost:9091",
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
