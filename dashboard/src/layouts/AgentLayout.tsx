import APITab from "../widgets/APITab/APITab";
import AgentDevToolWidget from "../widgets/AgentDevToolWidget";
import AgentMCP from "../widgets/AgentMCP/AgentMCP";
import BlueprintDrawerLayout from "./BlueprintDrawerLayout";
import BlueprintsWidget from "../widgets/BlueprintsWidget/BlueprintsWidget";
import Channel from "../widgets/Channel/Channel";
import { Iconify } from "@canmingir/link/platform/components";
import Knowledge from "../widgets/Knowledge/Knowledge";
import Profile from "../widgets/Profile/Profile";
import ProfileCard from "../components/ProfileCard/ProfileCard";
import Stack from "@mui/material/Stack";
import Supervising from "../widgets/Supervising/Supervising";
import SwaggerDialog from "../components/SwaggerDialog/SwaggerDialog";
import TasksWidget from "../widgets/TasksWidget/TasksWidget";
import config from "../../config";
import { getAgentGradients } from "../utils/gradient";
import useBlueprint from "../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";

import { Box, Skeleton, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
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
    value: "channels",
    label: "Channels",
    icon: <Iconify icon="material-symbols:chat" width={24} />,
  },
  {
    value: "mcps",
    label: "MCPs",
    icon: <Iconify icon="carbon:ibm-cloud-pak-integration" width={24} />,
  },
  {
    value: "api",
    label: "API",
    icon: <Iconify icon="mdi:api" width={24} />,
  },
];

function AgentLayout({
  agent,
  loading,
  initialTab,
  allAgentIds,
  onChatOpenChange,
}: {
  agent: {
    id: string;
    name: string;
    icon: string;
    teamId: string;
  };
  loading: boolean;
  initialTab?: string;
  allAgentIds?: string[];
  onChatOpenChange?: (open: boolean) => void;
}) {
  const { beta } = config;

  const visibleTabs = useMemo(() => {
    return TABS.filter((tab) => !beta || tab.value !== "api");
  }, [beta]);

  const location = useLocation();
  const navigate = useNavigate();

  const theme = useTheme();

  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get("tab");

  const safeInitial =
    initialTab && visibleTabs.some((t) => t.value === initialTab)
      ? initialTab
      : null;

  const [currentTab, setCurrentTab] = useState(
    safeInitial ||
      (visibleTabs.some((tab) => tab.value === tabFromQuery)
        ? tabFromQuery
        : "profile")
  );

  const [chatOpen, setChatOpen] = useState(false);
  const [swaggerOpen, setSwaggerOpen] = useState(false);

  const [swaggerEvent] = useEvent("SWAGGER_DIALOG_OPEN", { open: false });

  const [blueprintDrawerOpen, setBlueprintDrawerOpen] = useState(false);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(null);
  const { getBlueprintWithId } = useBlueprint();
  const { blueprint: selectedBlueprint } = getBlueprintWithId(
    selectedBlueprintId,
    [selectedBlueprintId]
  );

  const handleOpenBlueprint = (blueprintId: string) => {
    setSelectedBlueprintId(blueprintId);
    setBlueprintDrawerOpen(true);
  };

  const handleCloseBlueprintDrawer = () => {
    setBlueprintDrawerOpen(false);
    setSelectedBlueprintId(null);
  };

  useEffect(() => {
    if (swaggerEvent?.open) setSwaggerOpen(true);
  }, [swaggerEvent]);

  const handleDevToolOpenChange = (open: boolean) => {
    setChatOpen(open);
    onChatOpenChange?.(open);
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
      visibleTabs.some((tab) => tab.value === tabFromQuery) &&
      tabFromQuery !== currentTab
    ) {
      setCurrentTab(tabFromQuery);
    }
  }, [tabFromQuery, currentTab, visibleTabs]);

  return (
    <>
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Stack
          margin={2}
          sx={{ position: "relative", marginTop: 0, flexShrink: 0 }}
        >
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <ProfileCard
              TABS={visibleTabs}
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
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {currentTab === "profile" && <Profile agentId={agent.id} />}
          {currentTab === "knowledge-base" && (
            <Knowledge
              teamId={agent.teamId}
              agentId={agent.id}
              onBlueprintClick={handleOpenBlueprint}
            />
          )}
          {currentTab === "blueprints" && (
            <BlueprintsWidget teamId={agent.teamId} agentId={agent.id} />
          )}
          {currentTab === "supervisings" && <Supervising agentId={agent.id} />}
          {currentTab === "tasks" && <TasksWidget agentId={agent.id} />}
          {currentTab === "mcps" && <AgentMCP agent={agent} />}
          {currentTab === "channels" && <Channel />}
          {currentTab === "api" && !beta && <APITab agentId={agent.id} />}
        </Box>
      </Box>

      <AgentDevToolWidget
        agentId={agent.id}
        onOpenChange={handleDevToolOpenChange}
        beta={beta}
      />

      <SwaggerDialog
        swaggerOpen={swaggerOpen}
        setSwaggerOpen={setSwaggerOpen}
      />

      {blueprintDrawerOpen &&
        selectedBlueprint &&
        selectedBlueprint.id === selectedBlueprintId && (
          <BlueprintDrawerLayout
            drawerOpen={blueprintDrawerOpen}
            handleDrawerClose={handleCloseBlueprintDrawer}
            selectedItem={selectedBlueprint}
            agentId={agent.id}
            teamId={agent.teamId}
          />
        )}
    </>
  );
}

export default AgentLayout;
