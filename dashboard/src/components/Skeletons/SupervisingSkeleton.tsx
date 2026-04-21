import React from "react";

import { Box, Card, Divider, Skeleton } from "@mui/material";

const SupervisingSkeleton = () => {
  return (
    <Card>
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
            }}
          >
            <Skeleton variant="text" width={100} height={32} />
            <Skeleton variant="text" width={"60%"} height={32} />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
              width: 120,
            }}
          >
            <Skeleton variant="text" width={"100%"} height={20} />
            <Skeleton variant="text" width={"100%"} height={20} />

            <Skeleton
              sx={{ alignSelf: "center" }}
              variant="circular"
              width={40}
              height={40}
            />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default SupervisingSkeleton;
