import { Icon } from "@iconify/react";
import React from "react";

import { Box, Card, CardContent, Typography } from "@mui/material";

const FALLBACK_ICON = "mdi:server-network";

const MCPServerCard = ({
  providerName,
  description,
  icon,
  onOpen,
}: {
  serverId: string;
  providerName?: string;
  description?: string | null;
  icon?: string | null;
  onOpen: () => void;
}) => {
  return (
    <Card
      data-cy="mcp-server-card"
      sx={{
        height: "170px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
        transformStyle: "preserve-3d",
        transform:
          "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
        boxShadow: `
           1px 1px 0 #161c24,
            2px 2px 0 #161c24,
            3px 3px 0 #161c24,
            4px 4px 0 #161c24,
            5px 5px 0 #161c24,
            6px 6px 0 #161c24,
            7px 7px 0 #161c24,
            10px 10px 20px rgba(0, 0, 0, 0.4),
            20px 20px 40px rgba(0, 0, 0, 0.5)
          `,
        transition:
          "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, filter 0.25s ease",
        "&:hover": {
          cursor: "pointer",
        },
      }}
      onClick={onOpen}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          className="skill-icon"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
            width: 56,
            height: 56,
            borderRadius: 1,
            background: "rgba(255, 255, 255, 0.1)",
            boxShadow: `
            4px 4px 0 rgba(255, 255, 255, 0.1),
            5px 5px 5px rgba(0, 0, 0, 0.5)
          `,
            transform: "perspective(300px) rotateX(0deg) rotateY(0deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.3s",
            "& svg": {
              filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.35))",
              transform: "none",
            },
          }}
        >
          <Icon icon={icon ?? FALLBACK_ICON} width="30" height="30" />
        </Box>
        <Typography
          variant="h6"
          title={providerName}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {providerName}
        </Typography>
      </Box>
      <CardContent
        sx={{
          flex: 1,
          overflow: "hidden",
          p: 0,
          "&:last-child": { pb: 0 },
        }}
      >
        <Typography
          variant="body2"
          title={description ?? undefined}
          sx={{
            mt: 3.5,
            ml: 0.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MCPServerCard;
