import React from "react";

import { Box, Card, Skeleton } from "@mui/material";

const BlueprintSkeleton = () => {
  return (
    <Card sx={{ width: "60%", margin: "0 auto", mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          justifyContent: "center",
          position: "relative",
          gap: 1,
          borderRadius: 5,
          padding: 3,
          height: 250,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: 22,
            top: 18,
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
        </Box>

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
              paddingBottom: 2,
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />

            <Skeleton variant="text" width={"40%"} height={40} />
            <Skeleton variant="text" width={"80%"} height={40} />
          </Box>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: 84,
            bottom: 22,
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: 28,
            bottom: 22,
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      </Box>
    </Card>
  );
};

export default BlueprintSkeleton;
