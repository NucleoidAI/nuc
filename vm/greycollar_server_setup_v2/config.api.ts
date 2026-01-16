const config = {
  project: {
    name: "greycollar-api",
    version: "0.1.0",
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
    uri: "postgres://greyadmin:eyuTSfZ4vJmxWfDz@postgres:5432/greycollar-land",
    debug: false,
    sync: true,
  },
  dynamodb: {
    region: "us-east-1",
  },
  event: {
    type: "inMemory" as const,
    host: "inmemory",
    protocol: "http" as const,
    port: 8080,
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://localhost:9091",
    pushGateway: {
      jobName: "greycollar-database",
      instance: "default",
    },
    pushGateWayOpenTelemetry: {
      jobName: "greycollar-opentelemetry",
      instance: "default",
    },
    pushGatewayNodeEvents: {
      jobName: "greycollar-api-docker",
      instance: "node-events",
    },
  },
};

export default config;
