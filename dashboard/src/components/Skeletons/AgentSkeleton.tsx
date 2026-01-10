import React from "react";

import { Box, Skeleton, Stack } from "@mui/material";

const AgentSkeleton = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <Skeleton
        variant="rectangular"
        width={"100%"}
        height={150}
        sx={{ mb: 2, borderRadius: 2 }}
      />
      <Stack display={"flex"} flexDirection={"row"} gap={2}>
        <Skeleton
          variant="rectangular"
          width={"50%"}
          height={150}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width={"50%"}
          height={150}
          sx={{ borderRadius: 2 }}
        />
      </Stack>
      <Stack display={"flex"} flexDirection={"row"} gap={2} sx={{ mt: 2 }}>
        <Skeleton
          variant="rectangular"
          width={"25%"}
          height={120}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width={"25%"}
          height={120}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width={"25%"}
          height={120}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width={"25%"}
          height={120}
          sx={{ borderRadius: 2 }}
        />
      </Stack>
    </Box>
  );
};

export default AgentSkeleton;
