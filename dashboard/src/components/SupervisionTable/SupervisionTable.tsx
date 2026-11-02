import { Iconify } from "@canmingir/link/platform/components";
import React from "react";

import {
  Box,
  Card,
  Chip,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const SupervisionTable = ({
  agentFilter,
  setAgentFilter,
  agentOptions,
  agentCounts,
  setScope,
  filteredPending,
  goToSupervising,
}: {
  agentFilter: string;
  setAgentFilter: (value: string) => void;
  agentOptions: string[];
  agentCounts: Map<string, number>;
  setScope: (value: "TEAM" | "AGENT") => void;
  filteredPending: {
    id: string;
    waiting: number;
    agent: string;
    task: string;
    agentId: string;
  }[];
  goToSupervising: (agentId: string) => void;
}) => {
  return (
    <Card
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ p: 2 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Waiting for a decision
        </Typography>

        <Select
          size="small"
          value={agentFilter || "TEAM"}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "TEAM") {
              setScope("TEAM");
              setAgentFilter("");
            } else {
              setScope("AGENT");
              setAgentFilter(value);
            }
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="TEAM">Team</MenuItem>
          {agentOptions.map((agent) => (
            <MenuItem key={agent} value={agent}>
              {agent} ({agentCounts.get(agent)})
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Box
        sx={{
          overflowX: "auto",
          overflowY: "auto",
          height: "calc(100vh - 500px)",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Waiting</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Task</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Iconify
                      icon="solar:shield-check-line-duotone"
                      width={40}
                      sx={{ color: "text.disabled", mb: 1 }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      Nothing is waiting for a decision
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredPending.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  onClick={() => goToSupervising(item.agentId)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {item.waiting}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.agent}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 480 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.task}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <Chip
                        label="Supervision"
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
};

export default SupervisionTable;
