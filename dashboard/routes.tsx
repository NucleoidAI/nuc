import AddTeam from "./src/pages/addTeam";
import Agent from "./src/pages/agent";
import Agents from "./src/pages/agents";
import Callback from "./src/pages/callback";
import Chat from "./src/pages/chat";
import Container from "./src/Container";
import Cost from "./src/pages/cost";
import KnowledgeBase from "./src/pages/knowledgeBase";
import MCPs from "./src/pages/mcps";
import Monitoring from "./src/pages/monitoring";
import Operation from "./src/pages/operation";
import Reports from "./src/pages/reporting";
import TaskScores from "./src/pages/taskScores";
import Team from "./src/pages/team";
import { DashboardLayout, FullScreenLayout } from "@canmingir/link/layouts";

const routes = [
  {
    container: <Container />,
    childs: [
      {
        layout: <DashboardLayout />,
        pages: [
          {
            path: "/",
            element: <Team />,
          },
          {
            path: "/monitoring",
            element: <Monitoring />,
          },
          {
            path: `/agents`,
            element: <Agents />,
          },
          {
            path: `/mcps`,
            element: <MCPs />,
          },
          {
            path: `/knowledge`,
            element: <KnowledgeBase />,
          },
          { path: "/agents/:agentId", element: <Agent /> },
          { path: "/task-scores", element: <TaskScores /> },
          { path: "/cost", element: <Cost /> },
          { path: "/reports", element: <Reports /> },
          { path: "/operation", element: <Operation /> },
          { path: "/teams/add", element: <AddTeam /> },
          { path: "/mcps/callback", element: <Callback /> },
        ],
      },
      {
        layout: <FullScreenLayout />,
        pages: [
          { path: "/chat", element: <Chat /> },
          {
            path: "/team",
            element: <Team />,
          },
        ],
      },
    ],
  },
];

export default routes;
