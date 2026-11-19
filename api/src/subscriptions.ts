import agentFn from "./functions/agent";
import { event } from "@canmingir/link-express/event/client";
import platform from "@canmingir/link-express";
import taskFn from "./functions/task";

type Subscription = {
  type: string;
  handler: (payload: never) => unknown;
};

const subscriptions: Subscription[] = [
  {
    type: "MESSAGE_USER_MESSAGED",
    handler: ({ teamId, content }: { teamId: string; content: string }) =>
      agentFn.teamChat({ teamId, content }),
  },
  {
    type: "SESSION_USER_MESSAGED",
    handler: async ({
      agentId,
      sessionId,
      content,
      blueprintId,
    }: {
      agentId: string;
      sessionId: string;
      content: string;
      blueprintId?: string;
    }) => {
      try {
        if (!blueprintId) {
          await agentFn.chat({
            agentId,
            sessionId,
            content,
          });
        }
      } catch (error) {
        platform.logger.error(error);
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : "An error occurred while processing your message.";
        await event.publish("ERROR_OCCURRED", {
          sessionId,
          message: errorMessage,
        });
      }
    },
  },
  {
    type: "SUPERVISING_ANSWERED",
    handler: async ({
      answer,
      type,
      taskId,
    }: {
      sessionId: string;
      agentId: string;
      question: string;
      type: string;
      taskId: string;
      answer: string;
    }) => {
      const steps = await taskFn.listSteps({ taskId });

      const sortedSteps = [...steps].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log("steps", steps);

      const supervisedIndex = sortedSteps.findIndex(
        (step) => step.status === "SUPERVISED_NEEDED"
      );

      console.log("supervisedIndex", supervisedIndex);

      if (supervisedIndex === -1) return;

      const supervisedStep = sortedSteps[supervisedIndex];

      if (type === "KNOWLEDGE") {
        await taskFn.updateStep({
          stepId: supervisedStep.id,
          result: answer || supervisedStep.comment || "Completed",
          status: "COMPLETED",
        });
      } else {
        await taskFn.updateStep({
          stepId: supervisedStep.id,
          result: answer || supervisedStep.comment || "Completed",
          status: "COMPLETED",
        });
      }
    },
  },
  {
    type: "TASK_CREATED",
    handler: ({ taskId }: { taskId: string }) => agentFn.task({ taskId }),
  },
  {
    type: "STEP_ADDED",
    handler: ({
      stepId,
      action,
      parameters,
      comment,
      resultScore,
    }: {
      stepId: string;
      action: string;
      parameters: Record<string, unknown>;
      comment: string;
      resultScore?: number;
    }) => agentFn.step({ stepId, action, parameters, comment, resultScore }),
  },
  {
    type: "STEP_COMPLETED",
    handler: ({ taskId }: { taskId: string }) => agentFn.task({ taskId }),
  },
  {
    type: "STEP_FAILED",
    handler: ({ taskId }: { taskId: string; result: string }) =>
      agentFn.task({ taskId }),
  },
];

export type { Subscription };
export default subscriptions;
