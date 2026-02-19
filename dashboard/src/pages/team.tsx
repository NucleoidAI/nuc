import TeamChart from "../widgets/TeamChart/TeamChart";

import { Box, alpha } from "@mui/material";
import React, { useEffect } from "react";

const Team = () => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          backgroundColor: (theme) => theme.palette.background.default,
          backgroundImage: (theme) => `
            radial-gradient(
              ${alpha(theme.palette.divider, 0.08)} 1px,
              transparent 1px
            )
          `,
          backgroundSize: "16px 16px",
        }}
      >
        <TeamChart />
      </Box>
    </>
  );
};

export default Team;
