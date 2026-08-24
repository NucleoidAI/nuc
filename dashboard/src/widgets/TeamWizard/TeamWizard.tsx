import AgentStep from "../../components/AgentStep/AgentStep";
import BlueprintsWidget from "../BlueprintsWidget/BlueprintsWidget";
import DialogTitle from "@mui/material/DialogTitle";
import IconSelector from "../../components/IconSelector/IconSelector";
import ItemSummary from "../../components/ItemSummary/ItemSummary";
import Knowledge from "../Knowledge/Knowledge";
import type { Resolver } from "react-hook-form";
import type { SampleAgent } from "../../components/AgentStep/AgentStep";
import SparkleInput from "../../components/SparkleInput/SparkleInput";
import StepComponent from "../../components/StepComponent/StepComponent";
import { storage } from "@nucleoidjs/webstorage";
import useAIEngines from "../../hooks/useAIEngines";
import useAgents from "../../hooks/useAgents";
import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";
import useKnowledge from "../../hooks/useKnowledge";
import useOrganizations from "../../hooks/useOrganizations";
import useTeams from "../../hooks/useTeams";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import React, { useEffect } from "react";

import * as Yup from "yup";

const names = [
  "core_agent",
  "logic_agent",
  "ops_agent",
  "task_agent",
  "flow_agent",
  "insight_agent",
  "system_agent",
  "service_agent",
  "assist_agent",
  "analysis_agent",
];

const teamNames = [
  "Core Systems",
  "Operations",
  "Data Intelligence",
  "Automation",
  "Service Desk",
  "Product Ops",
  "Engineering",
  "Workflow Control",
  "AI Services",
  "Platform Support",
  "Orchestration",
  "MCP",
  "Infrastructure",
  "Quality Assurance",
  "User Support",
  "Strategy & Insights",
  "Process Management",
  "Dev Tools",
  "Knowledge Systems",
  "Execution Layer",
];

const descriptions = [
  "A core automation agent designed for general workflow execution.",
  "A logic-driven agent that assists with decision steps and rule-based operations.",
  "An operations-focused agent optimized for task handling and process stability.",
  "An analysis agent that interprets data, identifies patterns, and provides insights.",
  "A service-oriented agent built to support requests, coordination, and communication.",
];

const organizationNames = [
  "Northstar Labs",
  "Prime Systems",
  "EdgeWorks",
  "Apex Dynamics",
  "NextLayer",
  "CoreShift",
  "BlueWave Technologies",
  "Skyline Operations",
  "Quantum Forge",
  "Unity Solutions",
  "BrightPath",
  "Silverline Corp",
  "Vertex Group",
  "FlowLogic",
  "Gridspace",
  "Nimbus Tech",
  "OpenSphere",
  "Everlink Systems",
  "PulseWorks",
  "Circuit Collective",
];

const ORGANIZATION_STEP = 0;
const AGENT_STEP = 1;
const KNOWLEDGE_STEP = 2;
const BLUEPRINT_STEP = 3;
const SUMMARY_STEP = 4;

const cardSx = {
  mb: 2,
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

type PropertyOptionType =
  | "name"
  | "description"
  | "teamName"
  | "organizationName";

function TeamWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projectId = storage.get("projectId");
  const { organizations, loading } = useOrganizations().getOrganizations([]);
  const [activeStep, setActiveStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createError, setCreateError] = React.useState("");
  const [createdAgent, setCreatedAgent] = React.useState<{ id: string } | null>(
    null
  );
  const [createdTeam, setCreatedTeam] = React.useState<{ id: string } | null>(
    null
  );

  const { createOrganization } = useOrganizations();
  const { getAgentKnowledges } = useKnowledge();
  const { getBlueprintsByAgent } = useBlueprint();
  const { engines } = useAIEngines();
  const { createAgent } = useAgents();
  const { createTeam } = useTeams();

  const [blueprintUpsertedEvent] = useEvent("BLUEPRINT_UPSERTED", {
    Blueprint: null,
  });
  const [blueprintRemovedEvent] = useEvent("BLUEPRINT_REMOVED", {
    Blueprint: null,
  });
  const [blueprintPatchedEvent] = useEvent("BLUEPRINT_PATCHED", {
    Blueprint: null,
  });

  const agentId = createdAgent?.id;
  const teamId = createdTeam?.id;

  const { knowledges } = getAgentKnowledges(agentId);
  const { Blueprint: blueprints } = getBlueprintsByAgent(
    [
      blueprintUpsertedEvent.Blueprint,
      blueprintRemovedEvent.Blueprint,
      blueprintPatchedEvent.Blueprint,
    ],
    agentId
  );

  type FormValues = {
    organization: {
      id?: string;
      name: string;
    };
    team: {
      name: string;
      icon?: string;
      src?: string;
    };
    agent: {
      name: string;
      icon?: string;
      description: string;
      teamId?: string;
      aiEngineId: string;
      engineName?: string;
      src?: string;
    };
  };

  const TeamWizardSchema = Yup.object().shape({
    organization: Yup.object().shape({
      id: Yup.string().optional(),
      name: Yup.string().required("Organization name is required"),
    }),
    team: Yup.object().shape({
      name: Yup.string().required("Team name is required"),
      icon: Yup.string().optional(),
      src: Yup.string().optional(),
    }),
    agent: Yup.object().shape({
      name: Yup.string().required("Agent name is required"),
      description: Yup.string().required("Agent description is required"),
      icon: Yup.string().optional(),
      teamId: Yup.string().optional(),
      aiEngineId: Yup.string().required("AI Engine is required"),
      engineName: Yup.string().optional(),
      src: Yup.string().optional(),
    }),
  });

  const defaultValues: FormValues = {
    organization: {
      id: undefined,
      name: "",
    },
    team: {
      name: "",
      icon: "",
      src: "",
    },
    agent: {
      name: "",
      icon: "",
      description: "",
      teamId: "",
      aiEngineId: "",
      engineName: "",
      src: "",
    },
  };

  const resolver: Resolver<FormValues> = yupResolver(
    TeamWizardSchema
  ) as Resolver<FormValues>;

  const methods = useForm<FormValues>({
    resolver,
    defaultValues,
  });

  const {
    setValue,
    getValues,
    watch,
    reset,
    control,
    formState: { errors },
  } = methods;

  const agentValues = watch("agent");

  const steps = [
    "Organization & Team",
    "AI Agent",
    "Knowledge",
    "Blueprint",
    "Summary",
  ];

  const resetWizard = () => {
    reset(defaultValues);
    setActiveStep(0);
    setCreatedAgent(null);
    setCreatedTeam(null);
    setCreateError("");
  };

  useEffect(() => {
    if (!open) {
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isAgentStepComplete = Boolean(
    agentValues?.name?.trim() &&
      agentValues?.description?.trim() &&
      agentValues?.icon &&
      agentValues?.aiEngineId
  );

  const createOrganizationAndTeam = async () => {
    if (createdTeam?.id) {
      return createdTeam;
    }

    setIsSubmitting(true);
    setCreateError("");

    const organization = getValues("organization");
    let organizationId = organization.id;

    if (!organizationId) {
      const savedOrganization = await createOrganization(organization);

      if (!savedOrganization?.id) {
        setIsSubmitting(false);
        setCreateError("Could not create the organization. Please try again.");
        return null;
      }

      organizationId = savedOrganization.id;
      setValue("organization.id", organizationId);
    }

    const savedTeam = await createTeam(getValues("team"), organizationId);

    setIsSubmitting(false);

    if (!savedTeam?.id) {
      setCreateError("Could not create the team. Please try again.");
      return null;
    }

    setCreatedTeam(savedTeam);
    setValue("agent.teamId", savedTeam.id);

    return savedTeam;
  };

  const createEverything = async (agent: FormValues["agent"]) => {
    if (agentId) {
      return true;
    }

    const savedTeam = await createOrganizationAndTeam();

    if (!savedTeam?.id) {
      return false;
    }

    setIsSubmitting(true);
    setCreateError("");

    const savedAgent = await createAgent({ ...agent }, savedTeam.id);

    setIsSubmitting(false);

    if (!savedAgent?.id) {
      setCreateError("Could not create the agent. Please try again.");
      return false;
    }

    setCreatedAgent(savedAgent);

    return true;
  };

  const handleNext = async () => {
    switch (activeStep) {
      case ORGANIZATION_STEP: {
        const isValid = await methods.trigger("organization.name");
        const isTeamValid = await methods.trigger("team.name");

        if (!isValid || !isTeamValid) {
          return;
        }

        if (!agentId) {
          const savedTeam = await createOrganizationAndTeam();

          if (!savedTeam?.id) {
            return;
          }
        }

        break;
      }

      case AGENT_STEP: {
        const isValid = await methods.trigger("agent");

        if (!isValid) {
          return;
        }

        const created = await createEverything(getValues("agent"));

        if (!created) {
          return;
        }

        break;
      }

      default:
        break;
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    onClose();
    resetWizard();
  };

  const handleEmojiSelect = (emoji: { id: string; src: string }) => {
    setValue("team.icon", `:${emoji.id}:`, { shouldValidate: true });
    setValue("team.src", `${emoji.src}`, { shouldValidate: true });
  };

  const handleAvatarSelect = (emoji: { id: string; src?: string }) => {
    setValue("agent.icon", `:${emoji.id}:`, { shouldValidate: true });
    setValue("agent.src", `${emoji.src}`, { shouldValidate: true });
  };

  const handleEngineSelect = (engine: { id: string; vendor: string }) => {
    const isSelected = getValues("agent.aiEngineId") === engine.id;

    setValue("agent.aiEngineId", isSelected ? "" : engine.id, {
      shouldValidate: true,
    });
    setValue("agent.engineName", isSelected ? "" : engine.vendor, {
      shouldValidate: true,
    });
  };

  const handleRandomValue = (property: PropertyOptionType) => {
    let randomValue = "";
    switch (property) {
      case "name":
        randomValue = names[Math.floor(Math.random() * names.length)];
        break;
      case "description":
        randomValue =
          descriptions[Math.floor(Math.random() * descriptions.length)];
        break;
      case "teamName":
        randomValue = teamNames[Math.floor(Math.random() * teamNames.length)];
        break;
      case "organizationName":
        randomValue =
          organizationNames[
            Math.floor(Math.random() * organizationNames.length)
          ];
        break;
    }

    if (property === "name") {
      setValue("agent.name", randomValue, { shouldValidate: true });
    } else if (property === "description") {
      setValue("agent.description", randomValue, { shouldValidate: true });
    } else if (property === "teamName") {
      setValue("team.name", randomValue, { shouldValidate: true });
    } else if (property === "organizationName") {
      setValue("organization.name", randomValue, { shouldValidate: true });
    }
  };

  const handleTemplateSelect = async (agentTpl: SampleAgent) => {
    setValue("agent.name", agentTpl.name, { shouldValidate: true });
    setValue("agent.icon", agentTpl.icon, { shouldValidate: true });
    setValue("agent.description", agentTpl.description, {
      shouldValidate: true,
    });
    setValue("agent.aiEngineId", agentTpl.aiEngineId, {
      shouldValidate: true,
    });
    setValue("agent.engineName", agentTpl.engineName, {
      shouldValidate: true,
    });

    const created = await createEverything(getValues("agent"));

    if (!created) {
      return;
    }

    setActiveStep(KNOWLEDGE_STEP);
  };

  const handleOrganizationSelect = (organization: {
    id: string;
    name: string;
  }) => {
    setValue(
      "organization",
      {
        ...organization,
        name: organization.name,
      },
      { shouldValidate: true }
    );
  };

  const Organization = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Stack spacing={3} sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 0.01fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight={600} textAlign="center">
              Organization
            </Typography>
            <div>
              <Controller
                name="organization.name"
                control={control}
                render={({ field }) => (
                  <SparkleInput
                    data-cy="team-wizard-org-name-input"
                    prop="Organization Name"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onRandomValue={() => handleRandomValue("organizationName")}
                    multiline={""}
                  />
                )}
              />
              {errors.organization?.name && (
                <Typography color="error" variant="caption">
                  {errors.organization.name.message}
                </Typography>
              )}
            </div>
          </Stack>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" } }}
          />

          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight={600} textAlign="center">
              Team
            </Typography>
            <div>
              <Controller
                name="team.name"
                control={control}
                render={({ field }) => (
                  <SparkleInput
                    data-cy="team-wizard-name-input"
                    prop="Team Name"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onRandomValue={() => handleRandomValue("teamName")}
                    multiline={""}
                  />
                )}
              />
              {errors.team?.name && (
                <Typography color="error" variant="caption">
                  {errors.team.name.message}
                </Typography>
              )}
            </div>
            <IconSelector
              handleEmojiSelect={handleEmojiSelect}
              iconSrc={getValues("team.src")}
              icon={getValues("team.icon")?.replace(/:/g, "")}
            />
          </Stack>
        </Box>

        {organizations.length > 0 && (
          <>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Or choose an existing organization
              </Typography>
            </Divider>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 2,
              }}
            >
              {organizations.map((organization) => (
                <Card
                  data-cy="existing-organization"
                  key={organization.id}
                  onClick={() => handleOrganizationSelect(organization)}
                  variant="outlined"
                  sx={cardSx}
                >
                  <CardActionArea sx={{ height: "100%" }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Typography variant="subtitle1" component="div" noWrap>
                          {organization.name}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Stack>
    );
  };

  const StepPages = () => {
    switch (activeStep) {
      case ORGANIZATION_STEP:
        return (
          <>
            {createError && (
              <Alert severity="error" sx={{ mx: 4, mt: 2 }}>
                {createError}
              </Alert>
            )}
            <Organization />
          </>
        );
      case AGENT_STEP:
        return (
          <>
            {createError && (
              <Alert severity="error" sx={{ mx: 4, mt: 2 }}>
                {createError}
              </Alert>
            )}
            <AgentStep
              agent={agentValues}
              onFieldChange={(property, value) =>
                setValue(`agent.${property}`, value, { shouldValidate: true })
              }
              onRandomValue={handleRandomValue}
              onEmojiSelect={handleAvatarSelect}
              onEngineSelect={handleEngineSelect}
              onTemplateSelect={handleTemplateSelect}
              descriptionRows={3}
              errors={{
                name: errors.agent?.name?.message,
                description: errors.agent?.description?.message,
              }}
            />
          </>
        );
      case KNOWLEDGE_STEP:
        return (
          <Box
            data-cy="agent-wizard-knowledge-step"
            sx={{ position: "relative", height: "100%", minHeight: 400 }}
          >
            <Knowledge agentId={agentId} teamId={teamId} />
          </Box>
        );
      case BLUEPRINT_STEP:
        return (
          <Box
            data-cy="agent-wizard-blueprint-step"
            sx={{ position: "relative", height: "100%", minHeight: 400 }}
          >
            <BlueprintsWidget agentId={agentId} teamId={teamId} />
          </Box>
        );
      case SUMMARY_STEP:
        return (
          <ItemSummary
            newItem={{
              ...getValues("agent"),
              engine: engines?.find(
                (engine) => engine.id === getValues("agent.aiEngineId")
              ),
              team: getValues("team"),
              knowledges: knowledges ?? [],
              blueprints: blueprints ?? [],
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      data-cy="team-dialog"
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            height: "100%",
            outline: "none",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
      open={open}
      onClose={() => {
        if (organizations.length !== 0 && projectId) {
          onClose();
          resetWizard();
        }
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 1,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Stack spacing={0} alignItems="center" textAlign="center">
          <Typography variant="h6" component="div" lineHeight={1.2}>
            {"Create Team"}
          </Typography>
        </Stack>
      </DialogTitle>
      <StepComponent
        activeStep={activeStep}
        steps={steps}
        handleNext={handleNext}
        handleBack={handleBack}
        handleSave={handleSave}
        isSubmitting={isSubmitting}
        nextDisabled={activeStep === AGENT_STEP && !isAgentStepComplete}
      >
        <DialogContent
          sx={{
            p: 0,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        >
          {StepPages()}
        </DialogContent>
      </StepComponent>
    </Dialog>
  );
}

export default TeamWizard;
