import { Chip, Stack } from "@mui/material";

const SystemMeta = ({ agentId, blueprintId, sessionId }) => {
  const MetaChip = ({ label, value }: { label: string; value?: string }) => (
    <Chip
      variant="outlined"
      size="small"
      label={
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <span style={{ opacity: 0.7 }}>{label}:</span>
          <span style={{ fontFamily: "monospace" }}>{value || "-"}</span>
        </Stack>
      }
      sx={{
        borderRadius: 2,
        "& .MuiChip-label": { py: 0.25 },
      }}
    />
  );

  return (
    <Stack
      sx={{ cursor: "default" }}
      direction="row"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
    >
      <MetaChip label="Agent Id" value={agentId} />
      <MetaChip label="Blueprint Id" value={blueprintId} />
      <MetaChip label="Session Id" value={sessionId} />
    </Stack>
  );
};

export default SystemMeta;
