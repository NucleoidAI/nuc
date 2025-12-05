import { Flow } from "@canmingir/link/platform/components";
import { buildDefinitionGraph } from "./helper";
import { responsibilityChartPlugin } from "./ResponsibilityFlowPlugin";
import useResponsibility from "../../hooks/useResponsibility";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ResponsibilityFlow({ aiResponse, responsibility }) {
  // add aiResponse structure and show it on the flow diagram if needed

  const data = buildDefinitionGraph(responsibility);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [isLoading, setIsLoading] = useState(true);
  const { getResponsibilityWithNode } = useResponsibility();
  const { loading } = getResponsibilityWithNode(responsibility?.id);

  const getFlowDimensions = () => {
    if (isMobile) {
      return {
        width: "100%",
        height: "100%",
      };
    }
    if (isTablet) {
      return {
        width: "100%",
        height: "100%",
      };
    }
    return {
      width: "100%",
      height: "100%",
    };
  };

  useEffect(() => {
    if (loading) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <div>Loading flow diagram...</div>;
  }

  const flowDimensions = getFlowDimensions();

  return (
    <Box
      sx={{
        width: flowDimensions.width,
        height: flowDimensions.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        boxSizing: "border-box",
      }}
    >
      <Flow data={data} plugin={responsibilityChartPlugin} />
    </Box>
  );
}

export default ResponsibilityFlow;
