import Page from "../components/Page/Page";
import SupervisionRateSeries from "../widgets/SupervisionRateSeries/SupervisionRateSeries";
import SupervisionRateWidget from "../widgets/SupervisionRateWidget/SupervisionRateWidget";
import SupervisionTable from "../components/SupervisionTable/SupervisionTable";
import TimeRangePicker from "../components/TimeRangePicker/TimeRangePicker";
import { resolveTimeRange } from "../utils/resolveTimeRange";
import { Box, Stack } from "@mui/material";
import { useMemo, useState } from "react";

function Operation() {
  const [dateRange, setDateRange] = useState<string>("Last 30 days");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const range = useMemo(
    () => resolveTimeRange(dateRange, { from: customFrom, to: customTo }),
    [dateRange, customFrom, customTo]
  );
  return (
    <>
      <Page name="Operation" />
      <Box sx={{ px: 2 }}>
        <Stack spacing={2}>
          <TimeRangePicker
            range={dateRange}
            onRangeChange={setDateRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />

          <SupervisionRateWidget range={range} />

          <SupervisionRateSeries range={range} />

          <SupervisionTable range={range} />
        </Stack>
      </Box>
    </>
  );
}

export default Operation;
