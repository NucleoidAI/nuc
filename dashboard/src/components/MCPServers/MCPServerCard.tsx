import { Icon } from "@iconify/react";
import React from "react";

import { Box, Card, CardContent, Typography } from "@mui/material";

const FALLBACK_ICON = "mdi:server-network";

const MCPServerCard = ({
  serverId,
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
      sx={{
        height: 200,
        width: "100%",
        display: "flex",
        flexDirection: "column",
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
          gap: 1,
          padding: 1,
          minWidth: 0,
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
            background: "linear-gradient(145deg, #3a3f4b, #1f232b)",
            boxShadow: "4px 4px 0 #1f232b",
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
            ml: 1,
            minWidth: 0,
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
          minHeight: 0,
          overflow: "hidden",
          pt: 0,
        }}
      >
        <Typography
          variant="subtitle1"
          title={serverId}
          sx={{
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {serverId}
        </Typography>
        <Typography
          variant="body2"
          title={description ?? undefined}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
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
