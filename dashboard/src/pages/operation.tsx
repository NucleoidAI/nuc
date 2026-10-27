import { Box } from "@mui/material";
import OperationWidget from "../widgets/OperationWidget/OperationWidget";
import Page from "../components/Page/Page";

function Operation() {
  return (
    <>
      <Page name="Operation" />
      <Box sx={{ px: 2 }}>
        <OperationWidget />
      </Box>
    </>
  );
}

export default Operation;
