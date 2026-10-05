import AgentStep from "../../components/AgentStep/AgentStep";
import BlueprintsWidget from "../BlueprintsWidget/BlueprintsWidget";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ItemSummary from "../../components/ItemSummary/ItemSummary";
import Knowledge from "../Knowledge/Knowledge";
import React from "react";
import type { Resolver } from "react-hook-form";
import type { SampleAgent } from "../../components/AgentStep/AgentStep";
import StepComponent from "../../components/StepComponent/StepComponent";
import useAIEngines from "../../hooks/useAIEngines";
import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";
import { useForm } from "react-hook-form";
import useKnowledge from "../../hooks/useKnowledge";
import { yupResolver } from "@hookform/resolvers/yup";

import { Alert, Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

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

const descriptions = [
  "A core automation agent designed for general workflow execution.",
  "A logic-driven agent that assists with decision steps and rule-based operations.",
  "An operations-focused agent optimized for task handling and process stability.",
  "An analysis agent that interprets data, identifies patterns, and provides insights.",
  "A service-oriented agent built to support requests, coordination, and communication.",
];

const AGENT_STEP = 0;
const KNOWLEDGE_STEP = 1;
const BLUEPRINT_STEP = 2;
const SUMMARY_STEP = 3;

type AgentFormValues = {
  name: string;
  description: string;
  icon?: string;
  src?: string;
  aiEngineId: string;
  engineName?: string;
  teamId?: string;
};

const AgentWizardSchema = Yup.object().shape({
  name: Yup.string().required("Agent name is required"),
  description: Yup.string().required("Agent description is required"),
  icon: Yup.string().required("Agent icon is required"),
  src: Yup.string().optional(),
  aiEngineId: Yup.string().required("AI Engine is required"),
  engineName: Yup.string().optional(),
  teamId: Yup.string().optional(),
});

const defaultValues: AgentFormValues = {
  name: "",
  description: "",
  icon: "",
  src: "",
  aiEngineId: "",
  engineName: "",
  teamId: "",
};

function AgentWizard({ onSubmit, open, onClose, itemToEdit }) {
  const steps = ["Agent", "Knowledge", "Blueprint", "Summary"];

  const [activeStep, setActiveStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<{ id: string } | null>(null);
  const [createError, setCreateError] = useState("");
  const { getAgentKnowledges } = useKnowledge();
  const { getBlueprintsByAgent } = useBlueprint();
  const { engines } = useAIEngines();

  const resolver: Resolver<AgentFormValues> = yupResolver(
    AgentWizardSchema
  ) as Resolver<AgentFormValues>;

  const methods = useForm<AgentFormValues>({
    resolver,
    defaultValues,
  });

  const {
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = methods;

  const agentValues = watch();

  const [blueprintUpsertedEvent] = useEvent("BLUEPRINT_UPSERTED", {
    Blueprint: null,
  });
  const [blueprintRemovedEvent] = useEvent("BLUEPRINT_REMOVED", {
    Blueprint: null,
  });
  const [blueprintPatchedEvent] = useEvent("BLUEPRINT_PATCHED", {
    Blueprint: null,
  });

  const agentId = createdAgent?.id ?? itemToEdit?.id;

  const { knowledges: agentKnowledges } = getAgentKnowledges(agentId);
  const { Blueprint: agentBlueprints } = getBlueprintsByAgent(
    [
      blueprintUpsertedEvent.Blueprint,
      blueprintRemovedEvent.Blueprint,
      blueprintPatchedEvent.Blueprint,
    ],
    agentId
  );

  const createAgentFromForm = async (agent: AgentFormValues) => {
    setIsSubmitting(true);
    setCreateError("");

    const savedAgent = await onSubmit(agent);

    setIsSubmitting(false);

    if (!savedAgent?.id) {
      setCreateError("Could not create the agent. Please try again.");
      return null;
    }

    setCreatedAgent(savedAgent);
    reset({ ...getValues(), ...savedAgent }, { keepDefaultValues: true });

    return savedAgent;
  };

  const handleNext = async () => {
    if (activeStep === AGENT_STEP) {
      const isValid = await methods.trigger();

      if (!isValid) {
        return;
      }

      if (!agentId) {
        const savedAgent = await createAgentFromForm(getValues());

        if (!savedAgent) {
          return;
        }
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTemplateSelect = async (agentTpl: SampleAgent) => {
    setValue("name", agentTpl.name, { shouldValidate: true });
    setValue("icon", agentTpl.icon, { shouldValidate: true });
    setValue("description", agentTpl.description, { shouldValidate: true });
    setValue("aiEngineId", agentTpl.aiEngineId, { shouldValidate: true });
    setValue("engineName", agentTpl.engineName, { shouldValidate: true });

    if (agentId) {
      setActiveStep(KNOWLEDGE_STEP);
      return;
    }

    const savedAgent = await createAgentFromForm(getValues());

    if (!savedAgent) {
      return;
    }

    setActiveStep(KNOWLEDGE_STEP);
  };

  useEffect(() => {
    if (itemToEdit) {
      reset({ ...defaultValues, ...itemToEdit });
    } else if (!open) {
      reset(defaultValues);
      setCreatedAgent(null);
      setCreateError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemToEdit]);

  const handleSave = async () => {
    setIsSubmitting(true);

    if (itemToEdit) {
      await onSubmit(getValues());
    }

    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setActiveStep(0);
    setCreatedAgent(null);
    setCreateError("");
  };

  const handleEmojiSelect = (emoji: { id: string; src?: string }) => {
    setValue("icon", `:${emoji.id}:`, { shouldValidate: true });
    setValue("src", `${emoji.src}`, { shouldValidate: true });
  };

  const handleInputChange = (
    property: "name" | "description",
    value: string
  ) => {
    setValue(property, value, { shouldValidate: true });
  };

  const handleRandomValue = (property: "name" | "description") => {
    const randomValue =
      property === "name"
        ? names[Math.floor(Math.random() * names.length)]
        : descriptions[Math.floor(Math.random() * descriptions.length)];

    setValue(property, randomValue, { shouldValidate: true });
  };

  const handleEngineSelect = (engine: { id: string; vendor: string }) => {
    const isSelected = getValues("aiEngineId") === engine.id;

    setValue("aiEngineId", isSelected ? "" : engine.id, {
      shouldValidate: true,
    });
    setValue("engineName", isSelected ? "" : engine.vendor, {
      shouldValidate: true,
    });
  };

  const isAgentStepComplete = Boolean(
    agentValues?.name?.trim() &&
      agentValues?.description?.trim() &&
      agentValues?.icon &&
      agentValues?.aiEngineId
  );

  const StepPages = () => {
    switch (activeStep) {
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
              onFieldChange={handleInputChange}
              onRandomValue={handleRandomValue}
              onEmojiSelect={handleEmojiSelect}
              onEngineSelect={handleEngineSelect}
              onTemplateSelect={handleTemplateSelect}
              errors={{
                name: errors.name?.message,
                description: errors.description?.message,
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
            <Knowledge agentId={agentId} teamId={agentValues?.teamId} />
          </Box>
        );
      case BLUEPRINT_STEP:
        return (
          <Box
            data-cy="agent-wizard-blueprint-step"
            sx={{ position: "relative", height: "100%", minHeight: 400 }}
          >
            <BlueprintsWidget agentId={agentId} teamId={agentValues?.teamId} />
          </Box>
        );
      case SUMMARY_STEP:
        return (
          <ItemSummary
            newItem={{
              ...agentValues,
              engine: engines?.find(
                (engine) => engine.id === agentValues?.aiEngineId
              ),
              knowledges: agentKnowledges ?? [],
              blueprints: agentBlueprints ?? [],
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      data-cy="agent-dialog"
      type="large"
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
      open={open}
      onClose={handleClose}
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

export default AgentWizard;
