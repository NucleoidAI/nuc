import { Button, Card, Stack, TextField } from "@mui/material";

const TIME_RANGES = [
  "Last hour",
  "Last 24 hours",
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "This month",
  "Custom",
] as const;

function TimeRangePicker({
  range,
  onRangeChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  range: string;
  onRangeChange: (range: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}) {
  return (
    <Card
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        p: 1,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {TIME_RANGES.map((option) => (
          <Button
            key={option}
            size="small"
            onClick={() => onRangeChange(option)}
            variant={range === option ? "contained" : "outlined"}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            {option}
          </Button>
        ))}
      </Stack>

      {range === "Custom" && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}
        >
          <TextField
            type="date"
            size="small"
            label="From"
            slotProps={{ inputLabel: { shrink: true } }}
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            slotProps={{ inputLabel: { shrink: true } }}
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
          />
        </Stack>
      )}
    </Card>
  );
}

export default TimeRangePicker;
