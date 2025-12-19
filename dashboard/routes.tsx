import AddTeam from "./src/pages/addTeam";
import Agent from "./src/pages/agent";
import Agents from "./src/pages/agents";
import Callback from "./src/pages/callback";
import Chat from "./src/pages/chat";
import Container from "./src/Container";
import Dashboard from "./src/pages/dashboard";
import Integrations from "./src/pages/integrations";
import KnowledgeBase from "./src/pages/knowledgeBase";
import Settings from "./src/pages/settings";
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
            path: `/colleagues`,
            element: <Agents />,
          },
          {
            path: `/integrations`,
            element: <Integrations />,
          },
          {
            path: `/knowledge`,
            element: <KnowledgeBase />,
          },
          { path: "/colleagues/:colleagueId", element: <Agent /> },
          { path: "/settings", element: <Settings /> },
          { path: "/teams/add", element: <AddTeam /> },
          { path: "/integrations/callback", element: <Callback /> },
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
