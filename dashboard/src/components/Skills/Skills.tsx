import { Icon } from "@iconify/react";
import React from "react";

import { Box, Card, CardContent, Typography } from "@mui/material";

const Skills = ({
  title,
  description,
  icon,
  onSkillClick,
  id,
  oauth,
  action,
}: {
  title: string;
  description: string;
  icon: string;
  action: string;
  onSkillClick: (skill: {
    title: string;
    description: string;
    icon: string;
    action: string;
    id: string;
    oauth?: {
      tokenUrl: string;
      clientId: string;
      scope: string;
      redirectUri: string;
    };
  }) => void;
  id: string;
  oauth?: {
    tokenUrl: string;
    clientId: string;
    scope: string;
    redirectUri: string;
  };
}) => {
  return (
    <Card
      sx={{
        height: 200,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.3s",
        "&:hover": { transform: "scale(1.05)", cursor: "pointer" },
      }}
      onClick={() =>
        onSkillClick({ title, description, icon, id, oauth, action })
      }
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
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
            width: 56,
            height: 56,
            borderRadius: 2,
            background: "linear-gradient(145deg, #3a3f4b, #1f232b)",
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
            transform: "perspective(300px) rotateX(12deg) rotateY(-12deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.3s",
            "& svg": {
              filter: "drop-shadow(2px 3px 2px rgba(0, 0, 0, 0.35))",
              transform: "none",
            },
            "&:hover": {
              transform: "perspective(300px) rotateX(0deg) rotateY(0deg)",
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
            },
          }}
        >
          <Icon icon={icon} width="30" height="30" />
        </Box>
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
          title={action}
          sx={{
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {action}
        </Typography>
        <Typography
          variant="body2"
          title={description}
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

export default Skills;
