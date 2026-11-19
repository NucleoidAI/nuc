import type { Router } from "express";
import agents from "./agents";
import blueprintApi from "./blueprintApi";
import blueprintChat from "./blueprintChat";
import blueprints from "./blueprints";
import engines from "./engines";
import knowledge from "./knowledge";
import llmLogs from "./llmLogs";
import logicRules from "./logicRules";
import mcpProviders from "./mcpProviders";
import mcpServers from "./mcpServers";
import mcps from "./mcps";
import messages from "./messages";
import modelPricings from "./modelPricings";
import organizations from "./organizations";
import projects from "./projects";
import sessionApprovals, { taskApprovals } from "./sessionApprovals";
import sessions from "./sessions";
import statistics from "./statistics";
import stepScores from "./stepScores";
import supervisings from "./supervisings";
import tasks from "./tasks";
import teamDetails from "./teamDetails";

type Route = { path: string; router: Router };

const publicRoutes: Route[] = [
  { path: "/sessions", router: sessionApprovals },
  { path: "/tasks", router: taskApprovals },
  // TODO: Authenticate blueprint API calls before exposing them beyond development
  { path: "/execute", router: blueprintApi },
];

const routes: Route[] = [
  { path: "/projects", router: projects },
  { path: "/teams/details", router: teamDetails },
  { path: "/knowledge", router: knowledge },
  { path: "/logic-rules", router: logicRules },
  { path: "/messages", router: messages },
  { path: "/sessions", router: sessions },
  { path: "/supervisings", router: supervisings },
  { path: "/tasks", router: tasks },
  { path: "/step-scores", router: stepScores },
  { path: "/llm-logs", router: llmLogs },
  { path: "/model-pricings", router: modelPricings },
  { path: "/engines", router: engines },
  { path: "/organizations", router: organizations },
  { path: "/statistics", router: statistics },
  { path: "/agents", router: agents },
  { path: "/blueprints", router: blueprints },
  { path: "/blueprint-chat", router: blueprintChat },
  { path: "/mcps", router: mcps },
  { path: "/mcp-providers", router: mcpProviders },
  { path: "/mcp-servers", router: mcpServers },
];

export type { Route };
export { publicRoutes, routes };
