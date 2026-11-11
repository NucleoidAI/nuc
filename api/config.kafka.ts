const kafkaConfig = {
  type: "kafka" as const,
  clientId: "nuc",
  brokers: ["50.19.4.143:9092"],
  groupId: "nuc",
};

export default kafkaConfig;
