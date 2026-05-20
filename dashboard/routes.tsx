import AddTeam from "./src/pages/addTeam";
import Agent from "./src/pages/agent";
import Agents from "./src/pages/agents";
import Callback from "./src/pages/callback";
import Chat from "./src/pages/chat";
import Container from "./src/Container";
import Dashboard from "./src/pages/dashboard";
import KnowledgeBase from "./src/pages/knowledgeBase";
import MCPs from "./src/pages/mcps";
import StepLogs from "./src/pages/stepLogs";
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
            element: <Dashboard />,
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
          { path: "/task-logs", element: <StepLogs /> },
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
