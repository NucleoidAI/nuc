import { alpha } from "@mui/material/styles";
import { memo } from "react";

import { Stack, Typography } from "@mui/material";

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
        borderStyle: "none",
        borderColor: "transparent",
        backgroundColor: (theme) => alpha(theme.palette.grey[700], 0.4),
        animation: "none",
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
