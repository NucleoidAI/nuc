import React from "react";

import { Box, Card, Skeleton } from "@mui/material";

const AgentsSkeleton = () => {
  return (
    <Card sx={{ textAlign: "center", width: "255px" }}>
      <Box sx={{ position: "relative" }}>
        <Skeleton variant="rectangular" sx={{ height: "10rem" }} />
        <Skeleton
          variant="circular"
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -25,
          }}
        />
      </Box>
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Skeleton
          variant="text"
          sx={{
            width: "50%",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Skeleton
          variant="text"
          sx={{
            width: "85%",
            height: 100,
          }}
        />
      </Box>

      <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
        <Skeleton
          variant="text"
          sx={{
            width: "70%",
          }}
        />
      </Box>

      <Skeleton
        variant="circular"
        sx={{ width: 40, height: 40, position: "absolute", top: 8, right: 8 }}
      />
    </Card>
  );
};

export default AgentsSkeleton;
