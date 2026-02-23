import { Iconify } from "@canmingir/link/platform/components";
import { alpha } from "@mui/material/styles";

import { Box, IconButton, Stack } from "@mui/material";
import React, { memo } from "react";

const ErrorMessage: React.FC<{
  content: string;
  messageRef?: React.RefObject<HTMLDivElement>;
  onClose?: () => void;
}> = memo(({ content, messageRef, onClose }) => (
  <Stack
    ref={messageRef}
    sx={{
      p: 2.5,
      alignContent: "flex-start",
      justifyContent: "flex-start",
      backgroundColor: (theme) => alpha(theme.palette.error.dark, 0.2),
      borderRadius: 2,
      height: "auto",
      mt: 1.5,
      boxShadow: 1,
      border: (theme) => `1px solid ${alpha(theme.palette.error.light, 0.4)}`,
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      <Iconify
        icon="solar:danger-triangle-bold"
        sx={{
          width: 20,
          height: 20,
          color: (theme) => theme.palette.error.main,
        }}
      />
      <Box
        sx={{
          width: "100%",
          color: (theme) => theme.palette.error.light,
          fontSize: "0.95rem",
          lineHeight: 1.6,
        }}
      >
        {content}
      </Box>
      {onClose && (
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: (theme) => theme.palette.error.light,
            "&:hover": {
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <Iconify icon="mdi:close" sx={{ width: 18, height: 18 }} />
        </IconButton>
      )}
    </Stack>
  </Stack>
));

export { ErrorMessage };
