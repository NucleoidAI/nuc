import AddIcon from "@mui/icons-material/Add";
import React from "react";

import { Box, Button, Paper, Typography, useTheme } from "@mui/material";

const SampleNode = ({
  loadSampleFlow,
  handleStarterNodeClick,
}: {
  loadSampleFlow: () => void;
  handleStarterNodeClick: () => void;
}) => {
  const theme = useTheme();

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "background.paper",
          padding: 2,
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: "90%",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ display: "inline" }}
        >
          💡 Start by typing your scenario in the chat box, or use the editor to
          build your own workflow. You can import a sample flow by clicking:{" "}
          <Button
            onClick={loadSampleFlow}
            size="small"
            variant="outlined"
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.5px",
              color: "#0288d1",
              borderColor: "rgba(2, 136, 209, 0.5)",
              minWidth: "auto",
              padding: "1px 10px",
              borderRadius: "20px",
              marginLeft: 0.5,
              "&:hover": {
                borderColor: "#0288d1",
                backgroundColor: "rgba(2, 136, 209, 0.08)",
              },
            }}
          >
            Import Flow
          </Button>
        </Typography>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="800px"
        p={5}
      >
        <Paper
          onClick={handleStarterNodeClick}
          elevation={0}
          sx={{
            width: 280,
            height: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: 4,
            background: "background.paper",
            border: "2px solid",
            borderColor: theme.palette.divider,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}05 0%, ${theme.palette.secondary.main}03 100%)`,
              opacity: 0,
            },
            "&:hover": {
              "&::before": {
                opacity: 1,
              },
            },
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: `${theme.palette.primary.main}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: `0 8px 16px ${theme.palette.primary.main}30`,
            }}
          >
            <AddIcon sx={{ fontSize: 32, color: "white" }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={600}
            color="text.secondary"
            sx={{
              mb: 1,
            }}
          >
            Create Your First Node
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 400 }}
          >
            Click to start building intelligent workflows
          </Typography>
        </Paper>
      </Box>
    </>
  );
};

export default SampleNode;
