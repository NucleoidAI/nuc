import DialogTitle from "@mui/material/DialogTitle";
import EnginesChart from "../AIMarketplace/AIMarketplaceCard";
import IconSelector from "../../components/IconSelector/IconSelector";
import { Iconify } from "@canmingir/link/platform/components";
import type { Resolver } from "react-hook-form";
import SelectAvatar from "../../components/AvatarSelector/AvatarSelector";
import SparkleInput from "../../components/SparkleInput/SparkleInput";
import { Stack } from "@mui/material";
import StepComponent from "../../components/StepComponent/StepComponent";
import { Summary } from "../../components/ItemSummary/TeamSummary";
import { cleanIconName } from "../../utils/cleanIconName";
import { storage } from "@nucleoidjs/webstorage";
import useAgents from "../../hooks/useAgents";
import useOrganizations from ".././../hooks/useOrganziationsV2";
import useTeams from "../../hooks/useTeams";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import React, { useEffect } from "react";
import { publish, useEvent } from "@nucleoidai/react-event";

import * as Yup from "yup";

const sampleAgents = [
  {
    name: "system_agent",
    icon: "mingcute:bank-card-line",
    src: `https://cdn.nucleoid.com/greycollar/avatars/2.jpg`,
    aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
    engineName: "OpenAI",
    description:
      "A system-focused agent designed to support technical workflows, optimize architecture decisions, and improve reliability across operations.",
  },
  {
    name: "insight_agent",
    icon: "ph:coffee-bean-duotone",
    src: `https://cdn.nucleoid.com/greycollar/avatars/5.jpg`,
    aiEngineId: "d9c93323-3baf-4623-a96c-b85db99b4441",
    engineName: "Claude",
    description:
      "An insight-driven agent that analyzes information, identifies patterns, and provides clear, data-backed guidance for decision-making and problem-solving.",
  },
  {
    name: "order_agent",
    icon: "ph:atom-duotone",
    src: `https://cdn.nucleoid.com/greycollar/avatars/8.jpg`,
    aiEngineId: "123a3c9a-b23b-421a-ac6e-f14052a2d57c",
    engineName: "DeepMind",
    description:
      "An order agent built to streamline communication, align processes, and manage multi-step workflows across teams, systems, and projects for optimal efficiency.",
  },
];

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
  "Integration",
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

type PropertyOptionType =
  | "name"
  | "description"
  | "teamName"
  | "organizationName";

function TeamWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projectId = storage.get("projectId");
  const [teamSelected] = useEvent("PROJECT_SELECTED", { projectId: null });
  const { organizations, loading } = useOrganizations().getOrganizations([]);
  const [activeStep, setActiveStep] = React.useState(0);
  const { createOrganization } = useOrganizations();
  const { createAgent } = useAgents();
  const { createTeam } = useTeams();

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
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors },
  } = methods;

  const steps = [
    "Organization",
    "Team",
    "AI agent",
    "Avatar",
    "Description",
    "Engine",
    "Summary",
  ];

  const stepExp = [
    "Create Organization",
    "Create Team",
    "Give agent a name.",
    "Select an avatar that reflects your agent.",
    "Write down your agent's description. this will determine your agent's behavior.",
    "Select your agent's engine. this will determine your agent's engine.",
  ];

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        if (data.organization.id) {
          await createTeam(data.team, data.organization.id);
          publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: false });
        } else {
          const result = await createOrganization(data.organization);
          await createTeam(data.team, result.id);
          publish("PLATFORM", "PROJECT_BAR_DIALOG", { open: false });
        }

        setActiveStep(0);
        onClose();
      } catch (error) {
        console.error(error);
      }
    },
    (errors) => {
      console.log("Validation errors:", errors);

      if (errors.organization) {
        setActiveStep(0);
        return;
      }

      if (errors.team) {
        setActiveStep(1);
        return;
      }

      if (errors.agent) {
        if (errors.agent.name) {
          setActiveStep(2);
        } else if (errors.agent.icon) {
          setActiveStep(3);
        } else if (errors.agent.description) {
          setActiveStep(4);
        } else if (errors.agent.aiEngineId) {
          setActiveStep(5);
        }
      }
    }
  );

  useEffect(() => {
    const projectId = storage.get("projectId");
    console.log("projectId", projectId);
    console.log("name", getValues("agent.name"));
    if (teamSelected.projectId === projectId && getValues("agent.name")) {
      const agent = getValues("agent");
      agent.teamId = teamSelected.projectId;
      createAgent(agent, projectId);
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamSelected]);

  const handleNext = () => {
    const currentStep = activeStep;

    switch (currentStep) {
      case 0:
        methods.trigger("organization.name").then((isValid) => {
          if (isValid) {
            setActiveStep((prevStep) => prevStep + 1);
          }
        });
        return;

      case 1:
        methods.trigger("team.name").then((isValid) => {
          if (isValid) {
            setActiveStep((prevStep) => prevStep + 1);
          }
        });
        return;

      case 2:
        methods.trigger("agent.name").then((isValid) => {
          if (isValid) {
            setActiveStep((prevStep) => prevStep + 1);
          }
        });
        return;

      case 3:
        break;

      case 4:
        methods.trigger("agent.description").then((isValid) => {
          if (isValid) {
            setActiveStep((prevStep) => prevStep + 1);
          }
        });
        return;

      case 5:
        methods.trigger("agent.aiEngineId").then((isValid) => {
          if (isValid) {
            setActiveStep((prevStep) => prevStep + 1);
          }
        });
        return;

      default:
        break;
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = () => {
    const errors = methods.formState.errors;

    if (errors.organization?.name) {
      setActiveStep(0);
      return;
    }

    if (errors.team?.name) {
      setActiveStep(1);
      return;
    }

    if (errors.agent?.name) {
      setActiveStep(2);
      return;
    }

    if (errors.agent?.icon) {
      setActiveStep(3);
      return;
    }

    if (errors.agent?.description) {
      setActiveStep(4);
      return;
    }

    if (errors.agent?.aiEngineId) {
      setActiveStep(5);
      return;
    }

    onSubmit();
    setActiveStep(0);
  };

  const handleEmojiSelect = (emoji: { id: string; src: string }) => {
    setValue("team.icon", `:${emoji.id}:`, { shouldValidate: true });
    setValue("team.src", `${emoji.src}`, { shouldValidate: true });
  };

  const handleAvatarSelect = (emoji: { id: string; src: string }) => {
    setValue("agent.icon", `:${emoji.id}:`, { shouldValidate: true });
    setValue("agent.src", `${emoji.src}`, { shouldValidate: true });
  };

  const handleEngineSelect = (engine: { id: string; vendor: string }) => {
    setValue("agent.aiEngineId", engine.id, { shouldValidate: true });
    setValue("agent.engineName", engine.vendor, { shouldValidate: true });
    handleNext();
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

  const handleTemplateSelect = (agentTpl: (typeof sampleAgents)[0]) => {
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
    setActiveStep(6);
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
    setActiveStep(activeStep + 1);
  };

  const Organization = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
        {organizations.length > 0 && (
          <div>
            <Typography variant="body2" gutterBottom textAlign={"center"}>
              or Choose Existing Organization
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              {organizations.map((organization) => (
                <Card
                  key={organization.id}
                  onClick={() => handleOrganizationSelect(organization)}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <CardActionArea>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <Typography variant="h6" component="div">
                          {organization.name}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </div>
        )}
      </div>
    );
  };

  const Name = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <Controller
            name="team.name"
            control={control}
            render={({ field }) => (
              <SparkleInput
                data-cy="agent-wizard-name-input"
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
      </div>
    );
  };

  const AgentName = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <Controller
            name="agent.name"
            control={control}
            render={({ field }) => (
              <SparkleInput
                data-cy="agent-wizard-name-input"
                prop="name"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onRandomValue={() => handleRandomValue("name")}
                multiline={""}
              />
            )}
          />
          {errors.agent?.name && (
            <Typography color="error" variant="caption">
              {errors.agent.name.message}
            </Typography>
          )}
        </div>

        <div>
          <Typography variant="body2" gutterBottom textAlign={"center"}>
            Or choose one of the samples
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {sampleAgents.map((agent, index) => (
              <Card
                key={index}
                onClick={() => handleTemplateSelect(agent)}
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardActionArea>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <Iconify
                        icon={cleanIconName(agent.icon)}
                        width="20%"
                        height="20%"
                        style={{ objectFit: "contain" }}
                      />
                      <Typography variant="h6" component="div">
                        {agent.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {agent.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </div>
      </div>
    );
  };

  const Personality = () => {
    return (
      <>
        <Controller
          name="agent.description"
          control={control}
          render={({ field }) => (
            <SparkleInput
              data-cy="agent-wizard-description-input"
              prop="description"
              onChange={(e) => field.onChange(e.target.value)}
              onRandomValue={() => handleRandomValue("description")}
              value={field.value}
              multiline
              rows={11}
            />
          )}
        />
        {errors.agent?.description && (
          <Typography color="error" variant="caption">
            {errors.agent.description.message}
          </Typography>
        )}
      </>
    );
  };

  const StepPages = () => {
    switch (activeStep) {
      case 0:
        return <Organization />;
      case 1:
        return (
          <Stack spacing={2}>
            <Name />
            <IconSelector
              handleEmojiSelect={handleEmojiSelect}
              iconSrc={getValues("team.src")}
              icon={getValues("team.icon")?.replace(/:/g, "")}
            />
          </Stack>
        );
      case 2:
        return <AgentName />;
      case 3:
        return (
          <SelectAvatar
            handleEmojiSelect={handleAvatarSelect}
            iconSrc={getValues("agent.src")}
            icon={getValues("agent.icon")?.replace(/:/g, "")}
          />
        );
      case 4:
        return <Personality />;
      case 5:
        return (
          <EnginesChart
            handleEngineSelect={handleEngineSelect}
            isWizardEngine={true}
            open={""}
            setOpen={""}
          />
        );
      case 6:
        return (
          <Summary
            team={getValues("team")}
            organization={getValues("organization")}
            agent={getValues("agent")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      maxWidth={`xl`}
      open={open}
      onClose={() => {
        if (organizations.length !== 0 && projectId) {
          onClose();
          reset(defaultValues);
          setActiveStep(0);
        }
      }}
    >
      <>
        <DialogTitle
          sx={{
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        ></DialogTitle>
        <StepComponent
          activeStep={activeStep}
          steps={steps}
          stepExp={stepExp}
          handleNext={handleNext}
          handleBack={handleBack}
          handleSave={handleSave}
        >
          <DialogContent
            sx={{
              width: "100%",
              height: "100%",
              alignContent: "center",
              justifyContent: "center",
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            {StepPages()}
          </DialogContent>
        </StepComponent>
      </>
    </Dialog>
  );
}

export default TeamWizard;
