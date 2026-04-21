import { Iconify } from "@canmingir/link/platform/components";
import LoadingButton from "@mui/lab/LoadingButton";
import type { Resolver } from "react-hook-form";
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
  teamById,
  agents,
  organizations,
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
    } else if (organizations.length > 0) {
      setSelectedOptionId(organizations[0].id);
      setSelectedOptionType("organization");
    }
  }, [agentId, organizations]);

  const handleOptionChange = (event) => {
    const selectedOptionName = event.target.value;
    const selectedOption =
      organizations.find(
        (organization) => organization.name === selectedOptionName
      ) ||
      agents.find((agent) => agent.name === selectedOptionName) ||
      (teamById.name === selectedOptionName ? teamById : null);

    setSelectedOptionId(selectedOption?.id || "");
    if (
      organizations.find(
        (organization) => organization.name === selectedOptionName
      )
    ) {
      setSelectedOptionType("organization");
    } else if (agents.find((agent) => agent.name === selectedOptionName)) {
      setSelectedOptionType("agent");
    } else if (teamById.name === selectedOptionName) {
      setSelectedOptionType("team");
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
    };

    try {
      await addItem(payload, payload.agentId, payload.teamId);
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
        {!agentId && (
          <Select
            fullWidth
            value={
              organizations.find(
                (organization) => organization.id === selectedOptionId
              )?.name ||
              agents?.find((agent) => agent?.id === selectedOptionId)?.name ||
              (teamById?.id === selectedOptionId ? teamById?.name : "") ||
              ""
            }
            onChange={handleOptionChange}
            MenuProps={{
              sx: { zIndex: (theme) => theme.zIndex.modal + 4 },
            }}
          >
            {organizations.map((organization) => (
              <MenuItem key={organization.id} value={organization.name}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Iconify
                    icon={"jam:ghost-org-circle"}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box sx={{ ml: 1 }}>{organization.name}</Box>
                </Box>
              </MenuItem>
            ))}

            <MenuItem value={teamById?.name}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Iconify
                  icon={teamById?.icon.replace(/^:|:$/g, "")}
                  sx={{ width: 40, height: 40 }}
                />
                <Box sx={{ ml: 1 }}>{teamById?.name}</Box>
              </Box>
            </MenuItem>

            {agents?.map((agent) => (
              <MenuItem key={agent.id} value={agent.name}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <SourcedAvatar
                    source={"MINIMAL"}
                    iconUrl={agent.icon}
                    name={agent.name}
                  />
                  <Box sx={{ ml: 1 }}>{agent.name}</Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        )}

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
