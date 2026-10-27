import { Box } from "@mui/material";
import MonitoringWidget from "../widgets/MonitoringWidget/MonitoringWidget";
import Page from "../components/Page/Page";

function Monitoring() {
  return (
    <>
      <Page name="Monitoring" />
      <Box sx={{ px: 2 }}>
        <MonitoringWidget />
      </Box>
    </>
  );
}

export default Monitoring;
