import EnginesChart from "../../widgets/AIMarketplace/AIMarketplaceCard";
import { Iconify } from "@canmingir/link/platform/components";
import React from "react";
import SelectAvatar from "../AvatarSelector/AvatarSelector";
import SparkleInput from "../SparkleInput/SparkleInput";
import { cleanIconName } from "../../utils/cleanIconName";

import {
  Avatar,
  Box,
  ButtonBase,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export type SampleAgent = {
  name: string;
  group: string;
  icon: string;
  src?: string;
  aiEngineId: string;
  engineName?: string;
  description: string;
};

const SAMPLE_AI_ENGINE_ID = "816642c9-8a97-41d6-88fc-0f369e26646c";
const SAMPLE_ENGINE_NAME = "nuc";

export const SAMPLE_AGENTS: SampleAgent[] = [
  {
    name: "system_agent",
    group: "Management",
    icon: "ph:cpu-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/2.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A system-focused agent designed to support technical workflows, optimize architecture decisions, and improve reliability across operations.",
  },
  {
    name: "insight_agent",
    group: "Marketing",
    icon: "ph:coffee-bean-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/5.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "An insight-driven agent that analyzes information, identifies patterns, and provides clear, data-backed guidance for decision-making and problem-solving.",
  },
  {
    name: "order_agent",
    group: "Storage",
    icon: "ph:atom-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/8.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "An order agent built to streamline communication, align processes, and manage multi-step workflows across teams, systems, and projects for optimal efficiency.",
  },
  {
    name: "support_agent",
    group: "Support",
    icon: "ph:headset-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/1.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A front-line support agent that answers customer questions, triages incoming requests, and escalates the issues that need a human.",
  },
  {
    name: "campaign_agent",
    group: "Marketing",
    icon: "ph:swatches-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/3.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A campaign agent that drafts messaging, keeps channels consistent, and reports on how each launch is performing.",
  },
  {
    name: "finance_agent",
    group: "Finance",
    icon: "ph:currency-circle-dollar-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/4.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A finance agent that tracks spend, reconciles invoices, and flags anomalies before they reach the monthly close.",
  },
  {
    name: "security_agent",
    group: "Management",
    icon: "ph:shield-check-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/6.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A security agent that reviews access requests, watches for risky configuration changes, and keeps audit trails complete.",
  },
  {
    name: "inventory_agent",
    group: "Storage",
    icon: "ph:clipboard-text-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/7.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "An inventory agent that monitors stock levels, predicts shortages, and keeps warehouse records in sync with orders.",
  },
  {
    name: "research_agent",
    group: "Research",
    icon: "ph:book-open-text-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/9.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A research agent that gathers sources, summarizes long documents, and turns scattered findings into a usable brief.",
  },
  {
    name: "scheduling_agent",
    group: "Support",
    icon: "ph:notepad-duotone",
    src: "https://cdn.nucleoid.com/greycollar/avatars/10.jpg",
    aiEngineId: SAMPLE_AI_ENGINE_ID,
    engineName: SAMPLE_ENGINE_NAME,
    description:
      "A scheduling agent that coordinates calendars, books recurring meetings, and reshuffles plans when priorities change.",
  },
];

export const AGENT_GROUPS = [
  "All",
  "Marketing",
  "Management",
  "Storage",
  "Support",
  "Finance",
  "Research",
];

const cardSx = {
  cursor: "pointer",
  borderRadius: 2,
  transformStyle: "preserve-3d",
  transform: "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
  boxShadow: `
    1px 1px 0 #161c24,
    2px 2px 0 #161c24,
    3px 3px 0 #161c24,
    4px 4px 0 #161c24,
    5px 5px 0 #161c24,
    6px 6px 0 #161c24,
    7px 7px 0 #161c24,
    10px 10px 20px rgba(0, 0, 0, 0.4),
    20px 20px 40px rgba(0, 0, 0, 0.5)
  `,
  transition:
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, filter 0.25s ease",
  "&:hover": {
    transform:
      "perspective(1500px) rotateX(0deg) rotateY(-10deg) rotateZ(0deg)",
    filter: "brightness(1.070)",
    boxShadow: `
    1px 1px 0 #161c24,
    2px 2px 0 #161c24,
    3px 3px 0 #161c24,
    4px 4px 0 #161c24,
    5px 5px 0 #161c24,
    6px 6px 0 #161c24,
    7px 7px 0 #161c24,
    10px 10px 20px rgba(0, 0, 0, 0.4),
    20px 20px 40px rgba(0, 0, 0, 0.5)
  `,
  },
};

type AgentValues = {
  name?: string;
  description?: string;
  icon?: string;
  aiEngineId?: string;
};

function AgentStep({
  agent,
  onFieldChange,
  onRandomValue,
  onEmojiSelect,
  onEngineSelect,
  onTemplateSelect,
  errors,
  descriptionRows = 2,
  sampleAgents = SAMPLE_AGENTS,
}: {
  agent: AgentValues;
  onFieldChange: (property: "name" | "description", value: string) => void;
  onRandomValue: (property: "name" | "description") => void;
  onEmojiSelect: (emoji: { id: string; src?: string }) => void;
  onEngineSelect: (engine: { id: string; vendor: string }) => void;
  onTemplateSelect: (agent: SampleAgent) => void;
  errors?: { name?: string; description?: string };
  descriptionRows?: number;
  sampleAgents?: SampleAgent[];
}) {
  const [activeGroup, setActiveGroup] = React.useState("All");
  const [agentSearch, setAgentSearch] = React.useState("");

  const searchedAgents = sampleAgents.filter((sample) =>
    `${sample.name} ${sample.description}`
      .toLowerCase()
      .includes(agentSearch.trim().toLowerCase())
  );

  const countForGroup = (group: string) =>
    group === "All"
      ? searchedAgents.length
      : searchedAgents.filter((sample) => sample.group === group).length;

  const visibleAgents =
    activeGroup === "All"
      ? searchedAgents
      : searchedAgents.filter((sample) => sample.group === activeGroup);

  return (
    <Stack
      spacing={1}
      sx={{
        p: 1,
        height: { md: "100%" },
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 0.01fr 1fr" },
          gap: 1,
          alignItems: { xs: "start", md: "stretch" },
          px: 1,
          minHeight: 0,
          flexShrink: 0,
        }}
      >
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={600} textAlign="center">
            Agent Details
          </Typography>
          <SparkleInput
            data-cy="agent-wizard-name-input"
            prop="name"
            value={agent?.name ?? ""}
            onChange={(event) => onFieldChange("name", event.target.value)}
            onRandomValue={() => onRandomValue("name")}
            multiline={""}
          />
          {errors?.name && (
            <Typography color="error" variant="caption">
              {errors.name}
            </Typography>
          )}
          <SparkleInput
            data-cy="agent-wizard-description-input"
            prop="description"
            value={agent?.description ?? ""}
            onChange={(event) =>
              onFieldChange("description", event.target.value)
            }
            onRandomValue={() => onRandomValue("description")}
            multiline
            rows={descriptionRows}
          />
          {errors?.description && (
            <Typography color="error" variant="caption">
              {errors.description}
            </Typography>
          )}
          <SelectAvatar
            handleEmojiSelect={onEmojiSelect}
            newItem={{ icon: agent?.icon }}
          />
        </Stack>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", md: "block" } }}
        />

        <Stack
          sx={{
            minHeight: 0,
            height: { md: "100%" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} textAlign="center">
            Select AI Engine
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: { md: 1 },
            }}
          >
            <EnginesChart
              handleEngineSelect={onEngineSelect}
              selectedEngineId={agent?.aiEngineId}
              isWizardEngine={true}
              open={""}
              setOpen={""}
            />
          </Box>
        </Stack>
      </Box>

      <Divider>
        <Typography variant="body2" color="text.secondary">
          Or choose one of the samples
        </Typography>
      </Divider>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: { md: 1 },
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <TextField
          label="Search Agents"
          size="small"
          value={agentSearch}
          onChange={(event) => setAgentSearch(event.target.value)}
        />
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {AGENT_GROUPS.map((group) => (
            <ButtonBase
              data-cy="agent-group"
              key={group}
              onClick={() => setActiveGroup(group)}
              sx={{
                flexShrink: 0,
                gap: 0.5,
                p: 1,
                borderRadius: 1,
                border: 1,
                borderColor:
                  activeGroup === group ? "text.primary" : "background.paper",
                bgcolor:
                  activeGroup === group ? "action.selected" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {group}
              </Typography>
              <Chip
                label={String(countForGroup(group))}
                size="small"
                sx={{
                  bgcolor: "#1f232b",
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#1f232b" },
                }}
              />
            </ButtonBase>
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gridAutoRows: "min-content",
            gap: 1,
            alignContent: "start",
            height: { xs: 200, md: 0 },
            flex: { md: 1 },
            minHeight: { xs: 200, md: 60 },
          }}
        >
          {visibleAgents.map((sample, index) => (
            <Card
              data-cy="sample-agent"
              key={index}
              className="anim-hover-tilt"
              onClick={() => onTemplateSelect(sample)}
              variant="outlined"
              sx={cardSx}
            >
              <CardActionArea sx={{ height: "100%" }}>
                <CardContent sx={{ p: 1, "&:last-child": { pb: 1.5 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        color: "inherit",
                        bgcolor: "background.neutral",
                      }}
                    >
                      <Iconify icon={cleanIconName(sample.icon)} width={18} />
                    </Avatar>
                    <Typography variant="subtitle2" component="div" noWrap>
                      {sample.name}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {sample.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

export default AgentStep;
