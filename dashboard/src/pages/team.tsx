import { Box } from "@mui/material";
import TeamChart from "../widgets/TeamChart/TeamChart";

import React, { useEffect } from "react";

const Team = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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
        }}
      >
        <TeamChart />
      </Box>
    </>
  );
};

export default Team;
