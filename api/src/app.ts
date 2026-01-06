import "express";

import McpClient from "../../mcp/McpClient";
import agent from "./functions/agent";
import colleagues from "./routes/colleagues";
import communications from "./routes/communications";
import engines from "./routes/engines";
import { event } from "@canmingir/link-express/event/client";
import knowledge from "./routes/knowledge";
import mcps from "./routes/mcps";
import messages from "./routes/messages";
import organizations from "./routes/organizations";
import platform from "@canmingir/link-express";
import projects from "./routes/projects";
import sessions from "./routes/sessions";
import statistics from "./routes/statistics";
import supervisings from "./routes/supervisings";
import taskBluePrints from "./routes/taskBluePrints";
import tasks from "./routes/tasks";
import teamDetails from "./routes/teamDetails";
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

  app.use(authorization.verify);
  app.use(authorization.authorize("ADMIN"));

  app.use("/projects", projects);
  app.use("/teams/details", teamDetails);
  app.use("/knowledge", knowledge);
  app.use("/messages", messages);
  app.use("/sessions", sessions);
  app.use("/supervisings", supervisings);
  app.use("/tasks", tasks);
  app.use("/engines", engines);
  app.use("/organizations", organizations);
  app.use("/statistics", statistics);
  app.use("/agents", colleagues);
  app.use("/taskblueprints", taskBluePrints);
  app.use("/mcps", mcps);
  app.use("/communications", communications);

  (async () => {
    await event.subscribe<{ teamId: string; content: string }>(
      "MESSAGE_USER_MESSAGED",
      ({ teamId, content }) => agent.teamChat({ teamId, content })
    );

    await event.subscribe<{
      agentId: string;
      sessionId: string;
      content: string;
    }>("SESSION_USER_MESSAGED", ({ agentId, sessionId, content }) =>
      agent.chat({
        agentId,
        sessionId,
        content,
      })
    );

    await event.subscribe<{
      sessionId: string;
      agentId: string;
      question: string;
    }>("SUPERVISING_ANSWERED", ({ sessionId, agentId, question }) =>
      agent.chat({
        agentId,
        sessionId,
        content: question,
      })
    );

    await event.subscribe<{ taskId: string }>("TASK_CREATED", ({ taskId }) =>
      agent.task({ taskId })
    );

    await event.subscribe<{
      stepId: string;
      action: string;
      parameters: object;
      comment: string;
    }>("STEP_ADDED", ({ stepId, action, parameters, comment }) =>
      agent.step({ stepId, action, parameters, comment })
    );

    await event.subscribe<{ taskId: string }>("STEP_COMPLETED", ({ taskId }) =>
      agent.task({ taskId })
    );

    await event.subscribe<{
      id: string;
      type: string;
      agentId: string;
    }>("SESSION_INITIATED", async ({ id, type, agentId }) => {
      try {
        const mcpClient = new McpClient({
          name: "project-notifier",
          tool: "PROJECT_NOTIFIER:notify_project_open",
          version: "1.0.0",
        });

        await mcpClient.connectToServer({});

        const result = await mcpClient.callTool(
          "PROJECT_NOTIFIER:notify_project_open",
          {
            projectId: id,
            projectName: `Session ${type}`,
            timestamp: new Date().toISOString(),
          }
        );

        console.log("[PROJECT_NOTIFIER] Notification sent:", result);

        await mcpClient.close();
      } catch (error) {
        console.error("[PROJECT_NOTIFIER] Failed to send notification:", error);
      }
    });
  })();

  return app;
}

export default createApp();
