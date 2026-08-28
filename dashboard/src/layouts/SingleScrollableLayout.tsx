import React from "react";

import { Box, Grid } from "@mui/material";

function SingleScrollableLayout({ children }) {
  return (
    <>
      <Box sx={{ paddingX: 5 }}>
        <Grid container spacing={4}>
          {children}
        </Grid>
      </Box>
    </>
  );
}

export default SingleScrollableLayout;
