import { Iconify } from "@canmingir/link/platform/components";
import ResponsibilityDrawer from "../ResponsbilityDrawer/ResponsibilityDrawer";
import SupervisingChat from "../SupervisingChat";
import SupervisingTypeDialog from "../SupervisingTypeDialog";
import useResponsibility from "../../hooks/useResponsibility";
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

const SupervisingCard = ({
  supervise,
}: {
  supervise: {
    id: string;
    question?: string;
    answer?: string;
    status: string;
    responsibilityId?: string;
    taskId?: string;
  };
}) => {
  const [knowledgeChatOpen, setKnowledgeChatOpen] = useState(false);

  const [aiResponse, setAiResponse] = useState(null);

  const [responsibilityDrawerOpen, setResponsibilityDrawerOpen] =
    useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const { getResponsibilityById } = useResponsibility();

  const [responsibilitySelectedItem, setResponsibilitySelectedItem] =
    useState(null);

  const { responsibility } = getResponsibilityById(
    supervise.responsibilityId || ""
  );

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSelectKnowledge = () => {
    setDialogOpen(false);
    setKnowledgeChatOpen(true);
  };

  const handleSelectResponsibility = (responsibility: {
    id: string;
    title: string;
    description: string;
    colleagueId: string;
  }) => {
    setDialogOpen(false);
    setResponsibilityDrawerOpen(true);
    setResponsibilitySelectedItem(responsibility);
  };

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
            flexDirection: "column",
            alignContent: "center",
            justifyContent: "center",
            gap: 1,
            borderRadius: 5,
            padding: 2,
            height: 180,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 4,
                paddingTop: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                {supervise.responsibilityId && responsibility?.title && (
                  <Chip
                    icon={
                      <Iconify
                        icon="healthicons:crisis-response-center-person-outline"
                        sx={{ width: 16, height: 16 }}
                        color="inherit"
                        style={{ color: "#ff9800" }}
                      />
                    }
                    label={responsibility.title}
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
                  borderRadius: "8px",
                  paddingLeft: 0.5,
                  backgroundColor: "background.paper",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  {supervise.question}
                </Typography>
              </Box>

              <TextField
                data-cy="supervising-answer"
                variant="outlined"
                label="Answer"
                value={supervise.answer ? `${supervise.answer}` : ""}
                InputProps={{
                  readOnly: true,
                  style: { cursor: "text" },
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-input": {
                    cursor: "default",
                  },
                  marginTop: 1,
                }}
              />
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
                        <Typography
                          sx={{
                            mt: 1,
                          }}
                        >
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

              <Tooltip title="Open supervising options">
                <Fab
                  size="medium"
                  sx={{
                    alignSelf: "center",
                    textAlign: "center",
                  }}
                  color="inherit"
                  onClick={handleOpenDialog}
                >
                  <Iconify
                    icon={
                      supervise.status === "IN_PROGRESS"
                        ? "solar:reply-2-bold-duotone"
                        : "solar:check-read-line-duotone"
                    }
                    sx={{ width: 26, height: 26 }}
                  />
                </Fab>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Card>

      <SupervisingTypeDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSelectKnowledge={handleSelectKnowledge}
        onSelectResponsibility={(responsibility) =>
          handleSelectResponsibility(responsibility)
        }
        responsibility={responsibility}
      />

      <SupervisingChat
        open={knowledgeChatOpen}
        handleClose={() => setKnowledgeChatOpen(false)}
        supervise={supervise}
      />
      <ResponsibilityDrawer
        drawerOpen={responsibilityDrawerOpen}
        handleDrawerClose={() => setResponsibilityDrawerOpen(false)}
        selectedItem={responsibilitySelectedItem}
        taskId={supervise.taskId}
        setSelectedItem={setResponsibilitySelectedItem}
        setAiResponse={setAiResponse}
        aiResponse={aiResponse}
      />
    </>
  );
};

export default SupervisingCard;
