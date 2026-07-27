import { Box } from "@mui/material";
import CostWidget from "../widgets/CostWidget/CostWidget";
import Page from "../components/Page/Page";

function Cost() {
  return (
    <>
      <Page name="Cost" />
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 1 }}>
        <CostWidget />
      </Box>
    </>
  );
}

export default Cost;
