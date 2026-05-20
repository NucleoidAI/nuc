import { Iconify } from "@canmingir/link/platform/components";
import Page from "../components/Page/Page";
import TaskLogsWidget from "../widgets/TaskLogsWidget/TaskLogsWidget";
import useAgents from "../hooks/useAgents";
import { useState } from "react";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

function TaskLogs() {
  const { getTeamAgents } = useAgents();
  const { agents, loading } = getTeamAgents();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  return (
    <>
      <Page name="Task Logs" />

      <Box sx={{ px: { xs: 2, md: 4 }, pb: 1 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 1 }}
        >
          <Box sx={{ minWidth: 240 }}>
            {loading ? (
              <Skeleton
                variant="rounded"
                height={40}
                sx={{ borderRadius: 1 }}
              />
            ) : (
              <FormControl fullWidth>
                <InputLabel>Agents</InputLabel>
                <Select
                  label="Agents"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  renderValue={(val) => {
                    if (!val) return "Select an agent";
                    const agent = agents?.find(
                      (a: { id: string; name: string; icon?: string }) =>
                        a.id === val
                    );
                    return (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {agent?.icon && (
                          <Iconify icon={agent.icon} width={20} height={20} />
                        )}
                        <span>{agent?.name ?? val}</span>
                      </Stack>
                    );
                  }}
                >
                  <MenuItem value="" disabled>
                    Select an agent
                  </MenuItem>
                  {(agents ?? []).map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {agent.icon && (
                          <Iconify icon={agent.icon} width={20} height={20} />
                        )}
                        <span>{agent.name}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Stack>

        {!selectedAgentId ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 12,
              color: "text.disabled",
            }}
          >
            <Iconify
              icon="solar:inbox-line-duotone"
              width={64}
              sx={{ mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No agent selected
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Choose an agent from the dropdown above to view its task logs
            </Typography>
          </Box>
        ) : (
          <TaskLogsWidget agentId={selectedAgentId} />
        )}
      </Box>
    </>
  );
}

export default TaskLogs;
