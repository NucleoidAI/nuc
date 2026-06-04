import { Box, Stack, Typography } from "@mui/material";

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ width: 110, flexShrink: 0, color: "text.secondary" }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: "action.hover",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${(value ?? 0) * 100}%`,
            height: "100%",
            borderRadius: 3,
            bgcolor: color,
            transition: "width 0.3s ease",
          }}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{ width: 36, textAlign: "right", fontWeight: 700 }}
      >
        {value !== null ? value.toFixed(2) : "—"}
      </Typography>
    </Stack>
  );
}

export default ScoreBar;
