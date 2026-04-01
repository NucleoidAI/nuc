import LoadingButton from "@mui/lab/LoadingButton";
import type { Resolver } from "react-hook-form";
import type { SelectChangeEvent } from "@mui/material/Select";
import SourcedAvatar from "../SourcedAvatar/SourcedAvatar";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
} from "@mui/material";
import {
  FormProvider,
  RHFTextField,
} from "@canmingir/link/platform/components";
import { Iconify, Label } from "@canmingir/link/platform/components";
import React, { useEffect, useState } from "react";

import * as Yup from "yup";

function AddItemDialog({
  selectedType,
  types,
  open,
  setOpen,
  addItem,
  agentId,
  teamId,
  blueprintId,
  teamById,
  agents,
  organizations,
  blueprint,
  blueprints,
}: {
  selectedType: string;
  types: string[];
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (
    item: {
      type: string;
      url?: string;
      text?: string;
      question?: string;
      answer?: string;
      orgId?: string;
    },
    agentId?: string,
    teamId?: string,
    blueprintId?: string
  ) => Promise<void>;
  agentId?: string;
  teamId?: string;
  blueprintId?: string;
  teamById?: { id: string; name: string; icon: string };
  agents?: { id: string; name: string; icon: string }[];
  organizations?: { id: string; name: string }[];
  blueprint?: { id: string; title?: string; name?: string };
  blueprints?: { id: string; title?: string; name?: string }[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [selectedOptionType, setSelectedOptionType] = useState("");

  const [currentType, setCurrentType] = useState(
    selectedType === "ALL" ? "URL" : selectedType || "URL"
  );

  useEffect(() => {
    if (open) {
      setCurrentType(selectedType === "ALL" ? "URL" : selectedType);
    }
  }, [selectedType, open]);

  useEffect(() => {
    if (agentId) {
      setSelectedOptionId(agentId);
      setSelectedOptionType("agent");
    } else if (blueprints?.length > 0) {
      setSelectedOptionId(blueprints[0].id);
      setSelectedOptionType("blueprint");
    } else if (blueprint?.id) {
      setSelectedOptionId(blueprint.id);
      setSelectedOptionType("blueprint");
    } else if (teamById?.id) {
      setSelectedOptionId(teamById.id);
      setSelectedOptionType("team");
    } else if (organizations?.length > 0) {
      setSelectedOptionId(organizations[0].id);
      setSelectedOptionType("organization");
    }
  }, [agentId, blueprint, blueprints, organizations, teamById]);

  const handleOptionChange = (event: SelectChangeEvent<string>) => {
    const nextSelectedOptionId = event.target.value;

    setSelectedOptionId(nextSelectedOptionId);

    if (
      organizations?.some(
        (organization) => organization.id === nextSelectedOptionId
      )
    ) {
      setSelectedOptionType("organization");
    } else if (teamById?.id === nextSelectedOptionId) {
      setSelectedOptionType("team");
    } else if (agents?.some((agent) => agent.id === nextSelectedOptionId)) {
      setSelectedOptionType("agent");
    } else if (
      blueprints?.some((item) => item.id === nextSelectedOptionId) ||
      blueprint?.id === nextSelectedOptionId
    ) {
      setSelectedOptionType("blueprint");
    } else {
      setSelectedOptionType("");
    }
  };

  type FormValues = {
    inputValue: string;
    question: string;
    answer: string;
  };

  const initialValues: FormValues = {
    inputValue: "",
    question: "",
    answer: "",
  };

  const AddItemSchema = Yup.object().shape({
    inputValue:
      currentType === "URL"
        ? Yup.string()
            .required("URL cannot be an empty field")
            .url("Enter a valid URL")
        : currentType !== "QA"
        ? Yup.string()
            .required(`${currentType} cannot be an empty field`)
            .min(1)
        : Yup.string(),
    question:
      currentType === "QA"
        ? Yup.string().required("Question cannot be an empty field").min(1)
        : Yup.string(),
    answer:
      currentType === "QA"
        ? Yup.string().required("Answer cannot be an empty field").min(1)
        : Yup.string(),
  });

  const resolver: Resolver<FormValues> = yupResolver(
    AddItemSchema
  ) as Resolver<FormValues>;

  const methods = useForm({
    defaultValues: initialValues,
    resolver,
    mode: "onChange",
  });

  const {
    reset,
    handleSubmit,
    formState: { isValid },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const item: {
      type: string;
      url?: string;
      text?: string;
      question?: string;
      answer?: string;
    } = { type: currentType };

    if (currentType === "URL") {
      item.url = data.inputValue;
    } else if (currentType === "TEXT") {
      item.text = data.inputValue;
    } else if (currentType === "QA") {
      item.question = data.question;
      item.answer = data.answer;
    }

    const payload = {
      ...item,
      ...(selectedOptionType === "organization" && { orgId: selectedOptionId }),
      teamId: selectedOptionType === "team" ? selectedOptionId : teamId,
      agentId: selectedOptionType === "agent" ? selectedOptionId : agentId,
      blueprintId:
        selectedOptionType === "blueprint" ? selectedOptionId : blueprintId,
    };

    try {
      await addItem(
        payload,
        payload.agentId,
        payload.teamId,
        payload.blueprintId
      );
      setOpen(false);
    } catch (error) {
      setOpen(false);
    } finally {
      setIsSubmitting(false);
      reset();
    }
  });

  const handleChangeType = (event) => {
    setCurrentType(event.target.value);
    reset();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSubmitting) {
          setOpen(false);
        }
      }}
      fullWidth
      maxWidth="sm"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 3,
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          textAlign: "center",
        }}
      >
        {`Add New ${currentType}`}
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Select
          fullWidth
          value={selectedOptionId}
          onChange={handleOptionChange}
          MenuProps={{
            sx: { zIndex: (theme) => theme.zIndex.modal + 4 },
          }}
        >
          {organizations?.map((organization) => (
            <MenuItem key={organization?.id} value={organization?.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  width: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Iconify
                    icon={"jam:ghost-org-circle"}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box sx={{ ml: 1 }}>{organization?.name}</Box>
                </Box>
                <Label>Organization</Label>
              </Box>
            </MenuItem>
          ))}

          {teamById?.id && (
            <MenuItem value={teamById.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  width: "100%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Iconify
                    icon={teamById?.icon?.replace(/^:|:$/g, "")}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box sx={{ ml: 1 }}>{teamById?.name}</Box>
                </Box>
                <Label>Team</Label>
              </Box>
            </MenuItem>
          )}

          {agents
            ?.filter((agent) => !agentId || agent.id === agentId)
            .map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    width: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <SourcedAvatar
                      source={"MINIMAL"}
                      iconUrl={agent.icon}
                      name={agent.name}
                    />
                    <Box sx={{ ml: 1 }}>{agent.name}</Box>
                  </Box>
                  <Label>Agent</Label>
                </Box>
              </MenuItem>
            ))}

          {(blueprints?.length > 0
            ? blueprints
            : blueprint?.id
            ? [blueprint]
            : []
          ).map((item) => (
            <MenuItem key={item.id} value={item.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Iconify
                    icon="ph:flow-arrow"
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box sx={{ ml: 1 }}>{item.title || item.name}</Box>
                </Box>
                <Label>Blueprint</Label>
              </Box>
            </MenuItem>
          ))}
        </Select>

        <Select
          fullWidth
          sx={{ mt: 2 }}
          value={currentType}
          onChange={handleChangeType}
          data-cy="add-item-select"
          MenuProps={{
            sx: { zIndex: (theme) => theme.zIndex.modal + 4 },
          }}
        >
          {types.map((type) => (
            <MenuItem data-cy={`add-type-menu-${type}`} key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          {currentType !== "QA" && (
            <RHFTextField
              name="inputValue"
              label={`Enter ${currentType}`}
              data-cy="add-item-input"
            />
          )}
          {currentType === "QA" && (
            <Box>
              <RHFTextField
                name="question"
                label="Enter Question"
                sx={{ marginBottom: "1rem" }}
                data-cy="add-item-question"
              />
              <RHFTextField
                name="answer"
                label="Enter Answer"
                data-cy="add-item-answer"
              />
            </Box>
          )}
          <DialogActions
            sx={{
              justifyContent: "flex-end",
              padding: "1rem",
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            <LoadingButton
              type="submit"
              variant="contained"
              disabled={!isValid || isSubmitting}
              data-cy="finish"
            >
              {isSubmitting ? (
                <Box style={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress
                    size={18}
                    color="inherit"
                    style={{ marginRight: "8px" }}
                  />
                  Save
                </Box>
              ) : (
                <Box style={{ display: "flex", alignItems: "center" }}>
                  Save
                </Box>
              )}
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

export default AddItemDialog;
