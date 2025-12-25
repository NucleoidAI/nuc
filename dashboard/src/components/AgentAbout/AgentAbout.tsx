import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";

import {
  Box,
  Card,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import React, { useEffect, useState } from "react";

function AgentAbout({
  agent,
  updateAgent,
}: {
  agent: {
    id: string;
    name: string;
    description: string;
  } | null;
  updateAgent: (agent) => Promise<void>;
}) {
  const [description, setDescription] = useState(agent?.description);
  const [tempDescription, setTempDescription] = useState(agent?.description);
  const [isDescUpdated, setIsDescUpdated] = useState(true);

  const [name, setName] = useState(agent?.name);
  const [tempName, setTempName] = useState(agent?.name);
  const [isNameUpdated, setIsNameUpdated] = useState(true);

  useEffect(() => {
    if (agent) {
      setDescription(agent.description);
      setTempDescription(agent.description);

      setName(agent.name);
      setTempName(agent.name);
    }
  }, [agent]);

  const handleNameUpdate = async () => {
    if (isNameUpdated) {
      setIsNameUpdated(false);
      return;
    }

    setName(tempName);
    setIsNameUpdated(true);

    await updateAgent({
      ...agent,
      name: tempName,
      description: description,
    });
  };

  const handleDescriptionUpdate = async () => {
    if (isDescUpdated) {
      setIsDescUpdated(false);
      return;
    }

    setDescription(tempDescription);
    setIsDescUpdated(true);

    await updateAgent({
      ...agent,
      description: tempDescription,
      name: name,
    });
  };

  return (
    <Card
      sx={{ p: 2, height: "auto", display: "flex", flexDirection: "column" }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" fontWeight="bold">
              Name
            </Typography>

            <Tooltip title={isNameUpdated ? "Edit Name" : "Save Name"}>
              <IconButton
                size="small"
                color="default"
                onClick={handleNameUpdate}
                sx={{ p: 0.5 }}
              >
                {isNameUpdated ? (
                  <EditIcon fontSize="small" />
                ) : (
                  <CheckIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          {isNameUpdated ? (
            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
              {name || "—"}
            </Typography>
          ) : (
            <InputBase
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              fullWidth
              autoFocus
              placeholder="Enter agent name..."
              sx={{
                mt: 0.5,
                fontSize: "0.875rem",
                fontWeight: 500,
                p: 0.5,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                border: (theme) =>
                  `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                "&:hover": { borderColor: "primary.main" },
                "&.Mui-focused": {
                  borderColor: "primary.main",
                  boxShadow: (theme) =>
                    `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              }}
            />
          )}
        </Box>

        <Stack spacing={0} sx={{ flexGrow: 1, overflow: "hidden" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" fontWeight="bold">
              Description
            </Typography>

            <Tooltip
              title={isDescUpdated ? "Edit Description" : "Save Description"}
            >
              <IconButton
                size="small"
                color="default"
                onClick={handleDescriptionUpdate}
                sx={{ p: 0.5 }}
              >
                {isDescUpdated ? (
                  <EditIcon fontSize="small" />
                ) : (
                  <CheckIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
            {isDescUpdated ? (
              <Box sx={{ height: "100%", overflowY: "auto", pr: 0.5, mt: 0.5 }}>
                <Typography variant="body2">
                  {description || "No description provided."}
                </Typography>
              </Box>
            ) : (
              <InputBase
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="Enter agent description..."
                sx={{
                  mt: 0.5,
                  height: "100%",
                  alignItems: "start",
                  fontSize: "0.875rem",
                  p: 1,
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  border: (theme) =>
                    `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                  "&:hover": { borderColor: "primary.main" },
                  "&.Mui-focused": {
                    borderColor: "primary.main",
                    boxShadow: (theme) =>
                      `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}
              />
            )}
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

export default AgentAbout;
