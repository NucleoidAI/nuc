import "express";

import agentFn from "./functions/agent";
import agents from "./routes/agents";
import blueprintApi from "./routes/blueprintApi";
import blueprintChat from "./routes/blueprintChat";
import blueprints from "./routes/blueprints";
import channels from "./routes/channels";
import engines from "./routes/engines";
import { event } from "@canmingir/link-express/event/client";
import knowledge from "./routes/knowledge";
import llmLogs from "./routes/llmLogs";
import logicRules from "./routes/logicRules";
import { logLLM } from "./lib/llmLog";
import mcpProviders from "./routes/mcpProviders";
import mcpServers from "./routes/mcpServers";
import mcps from "./routes/mcps";
import messages from "./routes/messages";
import modelPricings from "./routes/modelPricings";
import organizations from "./routes/organizations";
import platform from "@canmingir/link-express";
import projects from "./routes/projects";
import sessionApprovals, { taskApprovals } from "./routes/sessionApprovals";
import sessions from "./routes/sessions";
import statistics from "./routes/statistics";
import stepScores from "./routes/stepScores";
import supervisings from "./routes/supervisings";
import taskFn from "./functions/task";
import tasks from "./routes/tasks";
import teamDetails from "./routes/teamDetails";
import { setLogger as setLLMLogger } from "@canmingir/link-express/llm";
import { telemetryMiddleware } from "./instrumentation";

declare module "express-serve-static-core" {
  interface Request {
    session: {
      userId: string;
      appId: string;
      organizationId: string;
      projectId: string;
    };
  }
}

function createApp() {
  const { express: app, authorization } = platform;

  app.use(telemetryMiddleware());

  setLLMLogger(logLLM);

  platform.publicRouter.use("/sessions", sessionApprovals);
  platform.publicRouter.use("/tasks", taskApprovals);
  // TODO: Authenticate blueprint API calls before exposing them beyond development
  platform.publicRouter.use("/execute", blueprintApi);

  app.use(authorization.authorize("ADMIN"));

  app.use("/projects", projects);
  app.use("/teams/details", teamDetails);
  app.use("/knowledge", knowledge);
  app.use("/logic-rules", logicRules);
  app.use("/messages", messages);
  app.use("/sessions", sessions);
  app.use("/supervisings", supervisings);
  app.use("/tasks", tasks);
  app.use("/step-scores", stepScores);
  app.use("/llm-logs", llmLogs);
  app.use("/model-pricings", modelPricings);
  app.use("/engines", engines);
  app.use("/organizations", organizations);
  app.use("/statistics", statistics);
  app.use("/agents", agents);
  app.use("/blueprints", blueprints);
  app.use("/blueprint-chat", blueprintChat);
  app.use("/mcps", mcps);
  app.use("/mcp-providers", mcpProviders);
  app.use("/mcp-servers", mcpServers);
  app.use("/channels", channels);

  setImmediate(() => {
    app.use((_req, res) => res.status(404).end());
    app.use(platform.error.handle);
  });

  (async () => {
    await event.subscribe<{ teamId: string; content: string }>(
      "MESSAGE_USER_MESSAGED",
      ({ teamId, content }) => agentFn.teamChat({ teamId, content }),
    );

    await event.subscribe<{
      agentId: string;
      sessionId: string;
      content: string;
      blueprintId?: string;
    }>(
      "SESSION_USER_MESSAGED",
      async ({ agentId, sessionId, content, blueprintId }) => {
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
    );

    await event.subscribe<{
      sessionId: string;
      agentId: string;
      question: string;
      type: string;
      taskId: string;
      answer: string;
    }>(
      "SUPERVISING_ANSWERED",
      async ({ sessionId, agentId, question, answer, type, taskId }) => {
        const steps = await taskFn.listSteps({ taskId });

        const sortedSteps = [...steps].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        console.log("steps", steps);

        const supervisedIndex = sortedSteps.findIndex(
          (step) => step.status === "SUPERVISED_NEEDED",
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
    );

    await event.subscribe<{ taskId: string }>("TASK_CREATED", ({ taskId }) =>
      agentFn.task({ taskId }),
    );

    await event.subscribe<{
      stepId: string;
      action: string;
      parameters: object;
      comment: string;
      resultScore?: number;
    }>("STEP_ADDED", ({ stepId, action, parameters, comment, resultScore }) =>
      agentFn.step({ stepId, action, parameters, comment, resultScore }),
    );

    await event.subscribe<{ taskId: string }>("STEP_COMPLETED", ({ taskId }) =>
      agentFn.task({ taskId }),
    );

    await event.subscribe<{
      taskId: string;
      result: string;
    }>("STEP_FAILED", ({ taskId, result }) => agentFn.task({ taskId }));
  })();

  return app;
}

export default createApp();
