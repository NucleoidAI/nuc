import { Iconify } from "@canmingir/link/platform/components";
import ResponsibilityDrawer from "../ResponsbilityDrawer/ResponsibilityDrawer";

import SupervisingChat from "../SupervisingChat";
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
    type: "KNOWLEDGE" | "RESPONSIBILITY";
    responsibilityId?: string;
  };
}) => {
  const [open, setOpen] = useState(false);
  const [responsibilityChatOpen, setResonsibilityChatOpen] = useState(false);
  const { getResponsibilityById } = useResponsibility();

  const { responsibility } = getResponsibilityById(
    supervise.responsibilityId || ""
  );

  const getCardStyles = () => {
    switch (supervise.type) {
      case "KNOWLEDGE":
        return {
          borderLeft: "4px solid #2196f3",
          backgroundColor: "background.paper",
        };
      case "RESPONSIBILITY":
        return {
          borderLeft: "4px solid #ff9800",
          backgroundColor: "background.paper",
        };
      default:
        return {
          backgroundColor: "background.paper",
        };
    }
  };

  const renderTypeSpecificActions = () => {
    switch (supervise.type) {
      case "KNOWLEDGE":
        return (
          <Tooltip title="Go to sessions">
            <Fab
              size="medium"
              sx={{
                alignSelf: "center",
                textAlign: "center",
              }}
              color="inherit"
              onClick={() => {
                setOpen(!open);
              }}
            >
              <Iconify
                icon={
                  open
                    ? "solar:chat-round-line-linear"
                    : "solar:chat-round-line-bold"
                }
                sx={{ width: 26, height: 26 }}
              />
            </Fab>
          </Tooltip>
        );
      case "RESPONSIBILITY":
        return (
          <Tooltip title="Go to responsibility">
            <Fab
              size="medium"
              sx={{
                alignSelf: "center",
                textAlign: "center",
              }}
              color="inherit"
              onClick={() => {
                setResonsibilityChatOpen(responsibilityChatOpen);
              }}
            >
              <Iconify
                icon={"healthicons:crisis-response-center-person-outline"}
                sx={{ width: 26, height: 26 }}
              />
            </Fab>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card data-cy="supervise-card" sx={getCardStyles()}>
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
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    backgroundColor:
                      supervise.type === "KNOWLEDGE"
                        ? "rgba(33, 150, 243, 0.1)"
                        : "rgba(255, 152, 0, 0.1)",
                    color:
                      supervise.type === "KNOWLEDGE" ? "#2196f3" : "#ff9800",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {supervise.type}
                </Box>
                {supervise.type === "RESPONSIBILITY" &&
                  responsibility?.title && (
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
                data-cy={`answer-${supervise.type}`}
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

              {renderTypeSpecificActions()}
            </Box>
          </Box>
        </Box>
      </Card>
      <SupervisingChat
        open={open}
        handleClose={() => setOpen(false)}
        supervise={supervise}
      />
      <ResponsibilityDrawer
        drawerOpen={responsibilityChatOpen}
        handleDrawerClose={() => setResonsibilityChatOpen(false)}
        selectedItem={responsibility || {}}
      />
    </>
  );
};

export default SupervisingCard;
