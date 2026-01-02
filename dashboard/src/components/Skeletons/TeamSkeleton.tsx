import React from "react";

import { Box, Skeleton } from "@mui/material";

const TeamSkeleton = () => {
  const ConnectorSkeleton = () => (
    <Skeleton
      variant="rectangular"
      width={2}
      height={40}
      animation="wave"
      sx={{ my: 0.5 }}
    />
  );

  const NodeSkeleton = ({ height = 100 }) => (
    <Skeleton
      variant="rectangular"
      width={380}
      height={height}
      animation="wave"
      sx={{ borderRadius: 3 }}
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "100vh",
        p: 4,
      }}
    >
      <NodeSkeleton height={120} />

      <ConnectorSkeleton />

      <NodeSkeleton height={120} />

      <ConnectorSkeleton />

      <NodeSkeleton height={120} />
    </Box>
  );
};

export default TeamSkeleton;
