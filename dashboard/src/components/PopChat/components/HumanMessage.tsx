import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import { memo } from "react";

import { Stack, Typography } from "@mui/material";

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const HumanMessage = memo(
  ({
    message,
    selectedId,
    messageRef,
  }: {
    message: { id: string; content: string };
    selectedId: string;
    messageRef: React.RefObject<HTMLDivElement>;
  }) => (
    <Stack
      ref={messageRef}
      sx={{
        p: 2.5,
        minHeight: "auto",
        mt: 1.5,
        ml: "auto",
        maxWidth: "85%",
        alignContent: "center",
        justifyContent: "center",
        borderWidth: message?.id === selectedId ? 3 : 0,
        borderRadius: "16px 16px 4px 16px",
        borderStyle: message?.id === selectedId ? "solid" : "none",
        borderColor: (theme) =>
          message?.id === selectedId
            ? theme.palette.warning.main
            : "transparent",
        backgroundColor: (theme) =>
          message?.id === selectedId
            ? alpha(theme.palette.warning.main, 0.25)
            : alpha(theme.palette.grey[700], 0.4),
        animation: message?.id === selectedId ? `${pulse} 1.2s` : "none",
        boxShadow: 1,
      }}
    >
      <Typography
        variant="body1"
        textAlign="end"
        sx={{
          fontSize: "0.95rem",
          lineHeight: 1.6,
          wordWrap: "break-word",
        }}
      >
        {message.content}
      </Typography>
    </Stack>
  )
);

export { HumanMessage };
