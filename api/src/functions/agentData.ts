import Agent from "../models/Agent";

async function get({ agentId }: { agentId: string }) {
  return await Agent.findByPk(agentId, {
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });
}

export default { get };
