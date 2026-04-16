import React from "react";
import { Skeleton } from "@mui/material";

const MCPSkeleton = () => {
  return (
    <>
      <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
    </>
  );
};

export default MCPSkeleton;
