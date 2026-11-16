import Agent from "../../models/Agent";
import MCPs from "../../mcps/mcps";
import actions from "../../actions";
import platform from "@canmingir/link-express";
import { resolveParameterRefs } from "../../lib/parameterRefs";
import session from "../session";
import { sessionVariables } from "./context";
import stepScoreFn from "../stepScore";
import taskFn from "../task";

type ActionType =
  | "MCP"
  | "SUPERVISED"
  | "SUPERVISED_RESPONDED"
  | "INTERACTION"
  | "APPROVAL"
  | "ACTION";

type StepStatus = Parameters<typeof taskFn.updateStep>[0]["status"];
type ScoreStatus = Parameters<typeof stepScoreFn.create>[0]["status"];

const PENDING_STATUS: Partial<
  Record<ActionType, { step: StepStatus; score: ScoreStatus }>
> = {
  APPROVAL: { step: "WAITING_FOR_APPROVAL", score: "COMPLETED" },
  INTERACTION: { step: "WAITING_FOR_USER", score: "COMPLETED" },
  SUPERVISED: { step: "SUPERVISED_NEEDED", score: "SUPERVISED" },
};

function actionTypeOf(action: string): ActionType {
  if (MCPs.find((mcp) => mcp.action === action)) return "MCP";

  switch (action) {
    case "PLATFORM:ask_supervisor":
      return "SUPERVISED";
    case "PLATFORM:user_interaction":
      return "INTERACTION";
    case "PLATFORM:customer_approval":
    case "PLATFORM:two_factor":
      return "APPROVAL";
    case "SUPERVISOR_RESPONDED":
      return "SUPERVISED_RESPONDED";
    default:
      return "ACTION";
  }
}

function loadAction(action: string, actionType: ActionType) {
  switch (actionType) {
    case "SUPERVISED":
      return require("../../actions/ask_supervisor").default;
    case "INTERACTION":
      return require("../../actions/interaction").default;
    case "APPROVAL":
      return action === "PLATFORM:two_factor"
        ? require("../../actions/two_factor").default
        : require("../../actions/customer_approval").default;
    case "ACTION":
      return require(`../../actions/${actions.find(action)?.lib}`).default;
    default:
      return undefined;
  }
}

async function connectMcp(action: string, agentId?: string) {
  if (!agentId) {
    throw new Error("MCP_STEP_REQUIRES_AGENT");
  }

  const agentInstance = await Agent.findByPk(agentId);

  if (!agentInstance?.teamId) {
    throw new Error("MCP_STEP_REQUIRES_AGENT");
  }

  return require("../../lib/mcp").default.connect({
    name: action.split(":")[0].toLowerCase(),
    teamId: agentInstance.teamId,
    agentId,
  });
}

function stringify(result: unknown, actionType: ActionType) {
  if (actionType === "MCP") {
    return (
      require("../../lib/mcpResult").unwrapToolResult(result) ??
      JSON.stringify(result)
    );
  }

  return result && typeof result === "object" ? JSON.stringify(result) : result;
}

async function step({
  stepId,
  action,
  parameters,
  resultScore,
}: {
  stepId: string;
  action: string;
  parameters: Record<string, unknown>;
  comment: string;
  resultScore?: number;
}) {
  const actionType = actionTypeOf(action);

  console.debug(
    `[agent.step] dispatching stepId=${stepId} action=${action} actionType=${actionType}`
  );

  let taskId = "";
  let mcpClient:
    | {
        close: () => Promise<void>;
        callTool: (action: string, args: object) => Promise<unknown>;
      }
    | undefined;

  try {
    const { taskId: stepTaskId, knowledgeScore } = await taskFn.getStep({
      stepId,
    });
    taskId = stepTaskId;
    // TODO: hallucinationScore will be calculated separately in the future
    const hallucinationScore = knowledgeScore;

    const [steps, { inheritedSteps, agentId, sessionId, variables }] =
      await Promise.all([taskFn.listSteps({ taskId }), taskFn.get({ taskId })]);

    const priorSteps = steps.filter((s) => s.id !== stepId);

    const runParameters = resolveParameterRefs(parameters, {
      steps: priorSteps,
      inherited_steps: inheritedSteps ?? [],
      session_variables:
        variables ?? (sessionId ? await sessionVariables({ sessionId }) : {}),
      byNode: Object.fromEntries(
        priorSteps.filter((s) => s.nodeId).map((s) => [s.nodeId, s])
      ),
    });

    let result;

    if (actionType === "MCP") {
      mcpClient = await connectMcp(action, agentId);
      result = await mcpClient!.callTool(action, runParameters);
    } else if (actionType !== "SUPERVISED_RESPONDED") {
      console.debug(
        `[agent.step] calling actionFn.run for action=${action} stepId=${stepId}`
      );

      result = await loadAction(action, actionType).run({
        context: steps
          .filter((step) => step.result)
          .map(
            ({ comment, result }) => `Comment: ${comment}\nResult: ${result}`
          )
          .join("\n"),
        parameters: runParameters,
        meta: { taskId, stepId },
      });

      console.debug(
        `[agent.step] actionFn.run returned for action=${action} stepId=${stepId}`
      );
    }

    const resultString = stringify(result, actionType);

    if (actionType === "SUPERVISED" && parameters.sessionId) {
      await session.addConversation({
        sessionId: parameters.sessionId as string,
        agentId: parameters.agentId as string,
        role: "ASSISTANT",
        content: "I need to ask my supervisor for more information.",
      });
    }

    const pending = PENDING_STATUS[actionType];
    const failed = !pending && (result as { isError?: boolean })?.isError;
    const outcome = failed ? "FAILED" : "COMPLETED";

    await taskFn.updateStep({
      stepId,
      result: pending ? resultString : resultString || "Completed",
      status: pending?.step ?? outcome,
    });

    await stepScoreFn.create({
      taskId,
      stepId,
      parameters,
      output: resultString,
      status: pending?.score ?? outcome,
      knowledgeScore,
      hallucinationScore,
      resultScore,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (action === "PLATFORM:two_factor" && taskId) {
        await taskFn.update({ taskId, status: "FAILED", comment: err.message });
      }
      await taskFn.updateStep({
        stepId,
        result: err.message,
        status: "FAILED",
      });
      if (taskId) {
        await stepScoreFn.create({
          taskId,
          stepId,
          parameters,
          output: err.message,
          status: "FAILED",
        });
      } else {
        platform.logger.error(
          `step ${stepId} failed before taskId resolved; skipping log: ${err.message}`
        );
      }
    }
  } finally {
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeErr) {
        platform.logger.error(
          `failed to close MCP client for step ${stepId}: ${closeErr}`
        );
      }
    }
  }
}

export default step;
