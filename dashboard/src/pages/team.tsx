import { Box } from "@mui/material";
import React from "react";
import TeamChart from "../widgets/TeamChart/TeamChart";

const Team = () => {
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
