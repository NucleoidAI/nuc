import knowledgeFn from "../functions/knowledge";
import taskFn from "../functions/task";

async function run({
  parameters,
  meta,
}: {
  parameters?: { agentId?: string };
  meta: { taskId: string };
}) {
  let agentId = parameters?.agentId;

  if (!agentId) {
    const task = await taskFn.get({ taskId: meta.taskId });
    agentId = task?.agentId;
  }

  if (!agentId) {
    return { error: "MISSING_AGENT_ID" };
  }

  const knowledge = await knowledgeFn.list({ agentId });

  return { agentId, knowledge };
}

export default { run };
