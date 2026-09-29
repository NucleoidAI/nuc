import { Icon } from "@iconify/react";
import React from "react";

import { Box, Card, Typography, alpha, useTheme } from "@mui/material";

function DiagramNodeCard(props) {
  const { node, width, height, title, subtitle, showIcon = true } = props;

  const theme = useTheme();

  return (
    <Card
      sx={{
        position: "absolute",
        width,
        height,
        top: node.y,
        left: node.x,
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        overflow: "hidden",
        borderRadius: 2,
        border: `1px solid rgba(145, 142, 142, 0.09)`,
        bgcolor: "rgba(163, 160, 160, 0.09)",
        boxShadow: `
            4px 4px 0 rgba(154, 151, 151, 0.18),
            5px 5px 5px rgba(0, 0, 0, 0.5)
          `,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          gap: 2,
          mb: 2,
          minHeight: 44,
        }}
      >
        {showIcon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.25,
              borderRadius: "14px",
              flexShrink: 0,
              bgcolor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: `
            4px 4px 0 rgba(255, 255, 255, 0.1),
            5px 5px 5px rgba(0, 0, 0, 0.5)
          `,
            }}
          >
            <Icon icon={node.icon} width="24" height="24" />
          </Box>
        )}

        <Typography
          title={title}
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "0.3px",
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Typography
        title={subtitle}
        sx={{
          mt: "auto",
          width: "100%",
          fontFamily: "monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: alpha(theme.palette.text.primary, 0.4),
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {subtitle}
      </Typography>
    </Card>
  );
}

export default DiagramNodeCard;
