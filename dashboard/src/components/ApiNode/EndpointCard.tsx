import { Iconify } from "@canmingir/link/platform/components";

import { Box, Button, Typography, alpha } from "@mui/material";
import { useEffect, useState } from "react";

export default function EndpointCard({
  endpoint,
  curl,
}: {
  endpoint: string;
  curl: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyCurl = async () => {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 1.25,
          pr: 0.5,
          py: 0.5,
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            px: 0.75,
            py: 0.25,
            borderRadius: 0.75,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            fontFamily: "monospace",
            color: "success.main",
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.14),
          }}
        >
          POST
        </Box>
        <Typography
          title={endpoint}
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {endpoint}
        </Typography>
        <Button
          size="small"
          onClick={copyCurl}
          aria-label="Copy as cURL"
          title="Copy as cURL"
          startIcon={
            <Iconify
              icon={copied ? "mdi:check" : "mdi:content-copy"}
              width={14}
              height={14}
            />
          }
          sx={{
            flexShrink: 0,
            minWidth: 0,
            px: 1,
            fontSize: 12,
            color: copied ? "success.main" : "text.secondary",
            "&:hover": { color: copied ? "success.main" : "text.primary" },
          }}
        >
          {copied ? "Copied" : "cURL"}
        </Button>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          px: 1.25,
          py: 1,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.black, 0.25)
              : theme.palette.grey[100],
          fontSize: 11,
          lineHeight: 1.6,
          fontFamily: "monospace",
          color: "text.secondary",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {curl}
      </Box>
    </Box>
  );
}
