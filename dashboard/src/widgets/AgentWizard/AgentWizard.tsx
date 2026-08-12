import BlueprintSelect from "../../components/WizardSelect/BlueprintSelect";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import EnginesChart from "../AIMarketplace/AIMarketplaceCard";
import { Iconify } from "@canmingir/link/platform/components";
import ItemSummary from "../../components/ItemSummary/ItemSummary";
import KnowledgeSelect from "../../components/WizardSelect/KnowledgeSelect";
import React from "react";
import SelectAvatar from "../../components/AvatarSelector/AvatarSelector";
import SparkleInput from "../../components/SparkleInput/SparkleInput";
import StepComponent from "../../components/StepComponent/StepComponent";
import { cleanIconName } from "../../utils/cleanIconName";

import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

function AgentWizard({ itemProperties, onSubmit, open, onClose, itemToEdit }) {
  const sampleAgents = [
    {
      name: "system_agent",
      icon: "mingcute:bank-card-line",
      aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
      engineName: "OpenAI",
      description:
        "A system-focused agent designed to support technical workflows, optimize architecture decisions, and improve reliability across operations.",
    },
    {
      name: "insight_agent",
      icon: "ph:coffee-bean-duotone",
      aiEngineId: "d9c93323-3baf-4623-a96c-b85db99b4441",
      engineName: "Claude",
      description:
        "An insight-driven agent that analyzes information, identifies patterns, and provides clear, data-backed guidance for decision-making.",
    },
    {
      name: "order_agent",
      icon: "ph:fire-simple-duotone",
      aiEngineId: "123a3c9a-b23b-421a-ac6e-f14052a2d57c",
      engineName: "DeepMind",
      description:
        "An order agent built to streamline communication, align processes, and manage multi-step workflows across teams and systems.",
    },
  ];

  const steps = ["Agent", "Knowledge", "Blueprint", "Summary"];

  const stepExp = [
    "Give agent a name, description and select an avatar that reflects your agent and select an engine for your agent.",
    "Select the knowledge your agent should have access to.",
    "Select the blueprints your agent should follow.",
    "Review and confirm the details of your new agent.",
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

  const descriptions = [
    "A core automation agent designed for general workflow execution.",
    "A logic-driven agent that assists with decision steps and rule-based operations.",
    "An operations-focused agent optimized for task handling and process stability.",
    "An analysis agent that interprets data, identifies patterns, and provides insights.",
    "A service-oriented agent built to support requests, coordination, and communication.",
  ];

  const [activeStep, setActiveStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const emptyItem = () => ({
    ...itemProperties.reduce(
      (obj, property) => ({ ...obj, [property]: "" }),
      {}
    ),
    knowledges: [],
    blueprints: [],
  });

  const [newItem, setNewItem] = useState(emptyItem);

  const handleTemplateSelect = (agent) => {
    setNewItem((prevItem) => ({
      ...agent,
      knowledges: prevItem.knowledges ?? [],
      blueprints: prevItem.blueprints ?? [],
    }));
    setActiveStep(steps.length - 1);
  };

  useEffect(() => {
    if (itemToEdit) {
      setNewItem({
        knowledges: [],
        blueprints: [],
        ...itemToEdit,
      });
    } else if (!open) {
      setNewItem(emptyItem());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemProperties, itemToEdit]);

  const toggleSelection = (property) => (item) => {
    setNewItem((prevItem) => {
      const current = prevItem[property] ?? [];
      const isSelected = current.some((selected) => selected.id === item.id);

      return {
        ...prevItem,
        [property]: isSelected
          ? current.filter((selected) => selected.id !== item.id)
          : [...current, item],
      };
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await onSubmit(newItem);
    setIsSubmitting(false);
    onClose();
    setActiveStep(0);
  };

  const handleEmojiSelect = (emoji) => {
    setNewItem((prevItem) => {
      return {
        ...prevItem,
        icon: `:${emoji.id}:`,
        src: `${emoji.src}`,
      };
    });
  };

  const handleInputChange = (property) => (event) => {
    setNewItem({ ...newItem, [property]: event.target.value });
  };

  const handleRandomValue = (property) => {
    let randomValue;
    switch (property) {
      case "name":
        randomValue = names[Math.floor(Math.random() * names.length)];
        break;
      case "description":
        randomValue =
          descriptions[Math.floor(Math.random() * descriptions.length)];
        break;
      default:
        randomValue = "";
    }
    setNewItem((prev) => ({ ...prev, [property]: randomValue }));
  };

  const isAgentStepComplete = Boolean(
    newItem["name"]?.trim() &&
      newItem["description"]?.trim() &&
      newItem["icon"] &&
      newItem["aiEngineId"]
  );

  const AgentStep = () => {
    return (
      <Stack spacing={3} sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
            alignItems: "start",
            p: 2,
          }}
        >
          <Stack spacing={2}>
            <SparkleInput
              data-cy="agent-wizard-name-input"
              prop="name"
              value={newItem["name"]}
              onChange={handleInputChange("name")}
              onRandomValue={() => handleRandomValue("name")}
              multiline={""}
            />
            <SparkleInput
              data-cy="agent-wizard-description-input"
              prop="description"
              onChange={handleInputChange("description")}
              onRandomValue={() => handleRandomValue("description")}
              value={newItem["description"]}
              multiline
              rows={5}
            />
            <SelectAvatar
              handleEmojiSelect={handleEmojiSelect}
              newItem={newItem}
            />
          </Stack>

          <Stack spacing={2}>
            <EnginesChart
              handleEngineSelect={handleEngineSelect}
              selectedEngineId={newItem["aiEngineId"]}
              isWizardEngine={true}
              open={""}
              setOpen={""}
            />
          </Stack>
        </Box>

        <Divider>
          <Typography variant="body2" color="text.secondary">
            Or choose one of the samples
          </Typography>
        </Divider>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 2,
          }}
        >
          {sampleAgents.map((agent, index) => (
            <Card
              data-cy="sample-agent"
              key={index}
              onClick={() => handleTemplateSelect(agent)}
              variant="outlined"
              sx={{
                mb: 2,
                cursor: "pointer",
                borderRadius: 2,
                transformStyle: "preserve-3d",
                transform:
                  "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
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
              }}
            >
              <CardActionArea sx={{ height: "100%" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        color: "inherit",
                        bgcolor: "background.neutral",
                      }}
                    >
                      <Iconify icon={cleanIconName(agent.icon)} width={22} />
                    </Avatar>
                    <Typography variant="subtitle1" component="div" noWrap>
                      {agent.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {agent.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Stack>
    );
  };

  const handleEngineSelect = (engine) => {
    setNewItem((prevItem) => ({
      ...prevItem,
      aiEngineId: prevItem.aiEngineId === engine.id ? "" : engine.id,
      engineName: prevItem.aiEngineId === engine.id ? "" : engine.vendor,
    }));
  };

  const StepPages = () => {
    switch (activeStep) {
      case 0:
        return AgentStep();
      case 1:
        return (
          <KnowledgeSelect
            selected={newItem.knowledges ?? []}
            onToggle={toggleSelection("knowledges")}
          />
        );
      case 2:
        return (
          <BlueprintSelect
            selected={newItem.blueprints ?? []}
            onToggle={toggleSelection("blueprints")}
          />
        );
      case 3:
        return <ItemSummary newItem={newItem} />;
    }
  };
  return (
    <Dialog
      data-cy="agent-dialog"
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          position: "relative",
          overflow: "visible",
        },
      }}
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
        onClose();
        setActiveStep(0);
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Stack spacing={0} alignItems="center" textAlign="center">
          <Typography variant="h6" component="div" lineHeight={1.2}>
            {itemToEdit ? "Edit Agent" : "Create Agent"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Set up your AI agent in a few steps
          </Typography>
        </Stack>
      </DialogTitle>
      <StepComponent
        activeStep={activeStep}
        steps={steps}
        stepExp={stepExp}
        handleNext={handleNext}
        handleBack={handleBack}
        handleSave={handleSave}
        isSubmitting={isSubmitting}
        nextDisabled={activeStep === 0 && !isAgentStepComplete}
      >
        <DialogContent
          sx={{
            p: 0,
            overflow: "visible",
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        >
          {StepPages()}
        </DialogContent>
      </StepComponent>
    </Dialog>
  );
}

export default AgentWizard;
