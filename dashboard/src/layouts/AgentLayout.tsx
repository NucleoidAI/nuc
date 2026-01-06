import AgentMCP from "../widgets/AgentMCP/AgentMCP";
import Communication from "../widgets/Communication/Communication";
import { Iconify } from "@canmingir/link/platform/components";
import Knowledge from "../widgets/Knowledge/Knowledge";
import PopupChatWidget from "../widgets/PopupChatWidget";
import Profile from "../widgets/Profile/Profile";
import ProfileCard from "../components/ProfileCard/ProfileCard";
import React from "react";
import Stack from "@mui/material/Stack";
import Supervising from "../widgets/Supervising/Supervising";
import TaskBluePrintsWidget from "../widgets/TaskBluePrintsWidget/TaskBluePrintsWidget";
import TasksWidget from "../widgets/TasksWidget/TasksWidget";
import { getAgentGradients } from "../utils/gradient";

import { Skeleton, Theme, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    value: "task-blue-prints",
    label: "Task Blueprints",
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
}: {
  agent: {
    id: string;
    name: string;
    icon: string;
  };
  loading: boolean;
  initialTab?: string;
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

  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const handleTabChange = (newTab) => {
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
      <Stack margin={2} sx={{ position: "relative", marginTop: -2 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : (
          <>
            <ProfileCard
              TABS={TABS}
              currentTab={currentTab}
              setCurrentTab={handleTabChange}
              name={agent.name}
              iconUrl={agent.icon}
              coverUrl={getAgentGradients(agent.id, theme)}
              loading={loading}
            />
            <Stack
              sx={{
                position: "absolute",
                bottom: mdDown ? "auto" : 50,
                left: mdDown ? "auto" : 60,
                top: mdDown ? 25 : "auto",
                right: mdDown ? 25 : "auto",
                zIndex: 1000,
              }}
            >
              <PopupChatWidget agentId={agent.id} />
            </Stack>
          </>
        )}
      </Stack>
      {currentTab === "profile" && <Profile agentId={agent.id} />}
      {currentTab === "knowledge-base" && <Knowledge agentId={agent.id} />}
      {currentTab === "task-blue-prints" && (
        <TaskBluePrintsWidget agentId={agent.id} />
      )}
      {currentTab === "supervisings" && <Supervising agentId={agent.id} />}
      {currentTab === "tasks" && <TasksWidget agentId={agent.id} />}
      {currentTab === "mcps" && <AgentMCP agent={agent} />}
      {currentTab === "communication" && <Communication />}
    </>
  );
}

export default AgentLayout;
