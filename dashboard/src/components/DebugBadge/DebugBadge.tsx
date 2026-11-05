import { Iconify } from "@canmingir/link/platform/components";
import { alpha } from "@mui/material/styles";

import { Box, type SxProps, type Theme } from "@mui/material";

const DebugBadge = ({ sx }: { sx?: SxProps<Theme> }) => (
  <Box
    component="span"
    data-cy="debug-badge"
    sx={[
      (theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.375,
        height: 20,
        px: 0.75,
        borderRadius: 1,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: theme.palette.warning.main,
        bgcolor: alpha(theme.palette.warning.main, 0.12),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.5)}`,
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Iconify icon="solar:bug-bold" width={12} />
    Debug
  </Box>
);

export default DebugBadge;
