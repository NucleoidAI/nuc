import { Iconify } from "@canmingir/link/platform/components";
import Page from "../components/Page/Page";
import ReportsWidget from "../widgets/ReportsWidget/ReportsWidget";
import { Box, Button, Stack, Typography } from "@mui/material";

function Reports() {
  return (
    <>
      <Page name="Reports" />
      <Box sx={{ px: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Reports
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:export-bold" width={18} />}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <ReportsWidget />
      </Box>
    </>
  );
}

export default Reports;
