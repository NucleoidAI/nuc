import { Iconify } from "@canmingir/link/platform/components";
import SupervisingChat from "../SupervisingChat";
import useBlueprint from "../../hooks/useBlueprint";
import { useState } from "react";

import {
  Box,
  Card,
  Chip,
  Divider,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

const SupervisingCard = ({
  supervise,
  agentId,
}: {
  supervise: {
    id: string;
    question?: string;
    answer?: string;
    status: string;
    blueprintId?: string;
    taskId?: string;
  };
  agentId?: string;
}) => {
  const [chatOpen, setChatOpen] = useState(false);

  const { getBlueprintWithId } = useBlueprint();
  const { blueprint } = getBlueprintWithId(supervise.blueprintId || "");

  return (
    <>
      <Card
        data-cy="supervise-card"
        sx={{
          borderLeft: "4px solid #2196f3",
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            padding: 2,
            minHeight: 140,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 4,
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 1,
                alignItems: "center",
                minHeight: 32,
              }}
            >
              {supervise.blueprintId && blueprint?.title && (
                <Chip
                  icon={
                    <Iconify
                      icon="healthicons:crisis-response-center-person-outline"
                      sx={{ width: 16, height: 16 }}
                      color="inherit"
                      style={{ color: "#ff9800" }}
                    />
                  }
                  label={blueprint.title}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                    color: "#ff9800",
                    fontWeight: 500,
                    border: "1px solid rgba(255, 152, 0, 0.3)",
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                paddingLeft: 0.5,
                pt: 1,
                pb: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                {supervise.question}
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <TableContainer>
              <Table
                size="small"
                sx={{
                  tableLayout: "fixed",
                  width: "120px",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ textAlign: "center" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Typography sx={{ mt: 1 }}>
                        {(() => {
                          switch (supervise.status) {
                            case "IN_PROGRESS":
                              return "In Progress";
                            case "ANSWERED":
                              return "Answered";
                            default:
                              return supervise.status;
                          }
                        })()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Tooltip title="Resolve Supervise">
              <Fab
                sx={{ alignSelf: "center" }}
                color="inherit"
                onClick={() => setChatOpen(true)}
              >
                <Iconify
                  icon="solar:reply-2-bold-duotone"
                  sx={{ width: 26, height: 26 }}
                />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      <SupervisingChat
        open={chatOpen}
        handleClose={() => setChatOpen(false)}
        supervise={supervise}
        agentId={agentId}
      />
    </>
  );
};

export default SupervisingCard;
