import AgentMCP from "../widgets/AgentMCP/AgentMCP";
import BlueprintsWidget from "../widgets/BlueprintsWidget/BlueprintsWidget";
import Communication from "../widgets/Communication/Communication";
import { Iconify } from "@canmingir/link/platform/components";
import Knowledge from "../widgets/Knowledge/Knowledge";
import Profile from "../widgets/Profile/Profile";
import ProfileCard from "../components/ProfileCard/ProfileCard";
import SidebarChatWidget from "../widgets/SidebarChatWidget";
import Stack from "@mui/material/Stack";
import Supervising from "../widgets/Supervising/Supervising";
import TasksWidget from "../widgets/TasksWidget/TasksWidget";
import { getAgentGradients } from "../utils/gradient";

import { Box, Skeleton, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DRAWER_WIDTH = 400;

const TABS = [
  {
    value: "profile",
    label: "Profile",
    icon: <Iconify icon="solar:user-id-bold" width={24} />,
  },
  {
    value: "knowledge-base",
    label: "Knowledge Base",
    icon: <Iconify icon="carbon:ibm-watson-knowledge-studio" width={24} />,
  },
  {
    value: "blueprints",
    label: "Blueprints",
    icon: (
      <Iconify
        icon="healthicons:crisis-response-center-person-outline"
        width={24}
      />
    ),
  },
  {
    value: "supervisings",
    label: "Supervisings",
    icon: <Iconify icon="solar:users-group-rounded-bold" width={24} />,
  },
  {
    value: "tasks",
    label: "Tasks",
    icon: <Iconify icon="material-symbols:task" width={24} />,
  },
  {
    value: "communication",
    label: "Communication",
    icon: <Iconify icon="material-symbols:chat" width={24} />,
  },
  {
    value: "mcps",
    label: "MCPs",
    icon: <Iconify icon="carbon:ibm-cloud-pak-integration" width={24} />,
  },
];

function AgentLayout({
  agent,
  loading,
  initialTab,
  fromDrawer,
  allAgentIds,
}: {
  agent: {
    id: string;
    name: string;
    icon: string;
  };
  loading: boolean;
  initialTab?: string;
  fromDrawer?: boolean;
  allAgentIds?: string[];
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const theme = useTheme();

  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get("tab");

  const safeInitial =
    initialTab && TABS.some((t) => t.value === initialTab) ? initialTab : null;

  const [currentTab, setCurrentTab] = useState(
    safeInitial ||
      (TABS.some((tab) => tab.value === tabFromQuery)
        ? tabFromQuery
        : "profile")
  );

  const [chatOpen, setChatOpen] = useState(false);

  const handleChatToggle = () => {
    setChatOpen((prev) => !prev);
  };

  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab);

    const newQueryParams = new URLSearchParams(location.search);
    newQueryParams.set("tab", newTab);

    navigate(
      {
        pathname: location.pathname,
        search: newQueryParams.toString(),
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (safeInitial && safeInitial !== currentTab) {
      setCurrentTab(safeInitial);

      const newQueryParams = new URLSearchParams(location.search);
      newQueryParams.set("tab", safeInitial);
      navigate(
        { pathname: location.pathname, search: newQueryParams.toString() },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeInitial]);

  useEffect(() => {
    if (
      tabFromQuery &&
      TABS.some((tab) => tab.value === tabFromQuery) &&
      tabFromQuery !== currentTab
    ) {
      setCurrentTab(tabFromQuery);
    }
  }, [tabFromQuery, currentTab]);

  return (
    <>
      <Box
        sx={{
          transition: "margin 0.3s ease-in-out",
          marginRight: chatOpen ? `${DRAWER_WIDTH}px` : 0,
        }}
      >
        <Stack margin={2} sx={{ position: "relative", marginTop: -2 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <ProfileCard
              TABS={TABS}
              currentTab={currentTab}
              setCurrentTab={handleTabChange}
              name={agent.name}
              iconUrl={agent.icon}
              coverUrl={getAgentGradients(agent.id, theme, allAgentIds)}
              loading={loading}
              sidebarOpen={chatOpen}
            />
          )}
        </Stack>
        {currentTab === "profile" && <Profile agentId={agent.id} />}
        {currentTab === "knowledge-base" && (
          <Knowledge agentId={agent.id} fromDrawer={fromDrawer} />
        )}
        {currentTab === "blueprints" && (
          <BlueprintsWidget agentId={agent.id} fromDrawer={fromDrawer} />
        )}
        {currentTab === "supervisings" && <Supervising agentId={agent.id} />}
        {currentTab === "tasks" && (
          <TasksWidget agentId={agent.id} fromDrawer={fromDrawer} />
        )}
        {currentTab === "mcps" && <AgentMCP agent={agent} />}
        {currentTab === "communication" && <Communication />}
      </Box>

      <SidebarChatWidget
        agentId={agent.id}
        open={chatOpen}
        onToggle={handleChatToggle}
      />
    </>
  );
}

export default AgentLayout;
