"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
  event: {
    type: "kafka",
    clientId: "greycollar-communication",
    brokers: ["docker.greycollar.ai:9094"],
    groupId: "greycollar-communication",
  },
  metrics: {
    enabled: true,
    interval: 15000,
    url: "http://pushgateway-land:9091",
    pushGateway: {
      jobName: "greycollar-communication",
      instance: "default",
    },
  },
  socket: {
    transports: ["polling", "websocket"],
  },
};
exports.default = config;
