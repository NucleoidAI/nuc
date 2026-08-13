import AddIcon from "@mui/icons-material/Add";
import React from "react";

import { Box, Paper, Typography, useTheme } from "@mui/material";

const SampleNode = ({
  handleStarterNodeClick,
}: {
  handleStarterNodeClick: () => void;
}) => {
  const theme = useTheme();

  return (
    <>
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
