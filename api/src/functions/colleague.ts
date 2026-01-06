import Colleague from "../models/Colleague";

async function get({ agentId }: { agentId: string }) {
  return await Colleague.findByPk(agentId, {
    attributes: { exclude: ["aiEngineId"] },
    include: ["AIEngine"],
  });
}

export default { get };
