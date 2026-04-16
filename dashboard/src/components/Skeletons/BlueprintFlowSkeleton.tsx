import React from "react";

import { Box, Skeleton } from "@mui/material";

function BlueprintFlowSkeleton({
  nodeCount = 4,
  nodeHeight = 120,
}: {
  nodeCount?: number;
  nodeHeight?: number;
}) {
  const ConnectorSkeleton = () => (
    <Skeleton
      variant="rectangular"
      width={40}
      height={2}
      animation="wave"
      sx={{ mx: 0.5 }}
    />
  );

  const NodeSkeleton = ({ height = 100 }) => (
    <Skeleton
      variant="rectangular"
      width={280}
      height={height}
      animation="wave"
      sx={{ borderRadius: 3 }}
    />
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "100vh",
        p: 4,
      }}
    >
      {Array.from({ length: nodeCount }).map((_, i) => (
        <React.Fragment key={i}>
          <NodeSkeleton height={nodeHeight} />
          {i < nodeCount - 1 ? <ConnectorSkeleton /> : null}
        </React.Fragment>
      ))}
    </Box>
  );
}

export default BlueprintFlowSkeleton;
