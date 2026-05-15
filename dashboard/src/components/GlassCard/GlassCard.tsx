import React from "react";

import { Box, Card, Divider, Typography, useTheme } from "@mui/material";

const GlassCard = ({
  width,
  height,
  header,
  content,
  actions,
  contentSx,
}: {
  height?: string;
  width?: string;
  header?: { title: string; subtitle?: string };
  content: React.ReactNode;
  actions?: React.ReactNode;
  contentSx?: object;
}) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        width: width || "100%",
        height: height || "85vh",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}05 100%)`,
        backdropFilter: "blur(10px)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {header && (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              minHeight: 52,
              flexShrink: 0,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {header.title}
              </Typography>
              {header.subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.3,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header.subtitle}
                </Typography>
              )}
            </Box>
            {actions && <Box sx={{ ml: 1, flexShrink: 0 }}>{actions}</Box>}
          </Box>
          <Divider sx={{ borderColor: theme.palette.divider }} />
        </>
      )}
      <Box
        sx={{ flex: 1, overflow: "auto", position: "relative", ...contentSx }}
      >
        {!header && actions && (
          <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
            {actions}
          </Box>
        )}
        {content}
      </Box>
    </Card>
  );
};

export default GlassCard;
