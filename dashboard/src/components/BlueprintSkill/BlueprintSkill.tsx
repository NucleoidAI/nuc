import React from "react";
import ReactMarkdown from "react-markdown";
import SkillMd from "../SkillMd/SkillMd";
import remarkGfm from "remark-gfm";

import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
} from "@canmingir/link/platform/components";

const BlueprintSkill = ({ skill, skillLoading, showKnowledge }) => {
  const theme = useTheme();
  const renderSkillContent = () => {
    if (!skill && !skillLoading) return null;

    return (
      <Box
        sx={{
          fontSize: "0.875rem",
          color: theme.palette.text.secondary,
          "& p": { m: 0, mb: 0.5 },
          "& ul": { pl: 2, m: 0, mb: 0.5 },
          "& h1, & h2, & h3": {
            fontSize: "0.95rem",
            fontWeight: 600,
            m: 0,
            mb: 0.5,
            color: theme.palette.text.primary,
          },
          "& code": {
            fontFamily: "monospace",
            backgroundColor: theme.palette.action.hover,
            borderRadius: 0.5,
            px: 0.5,
          },
        }}
      >
        {skill && (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill}</ReactMarkdown>
        )}
        {skillLoading && (
          <CircularProgress
            sx={{ ml: 1 }}
            color="inherit"
            size={14}
            thickness={5}
          />
        )}
      </Box>
    );
  };

  return (
    <>
      {!showKnowledge && (
        <GlassCard sx={{ mt: -1 }}>
          <GlassCardHeader
            sx={{
              p: 1,
              width: 500,
            }}
            title={
              <Typography variant="subtitle2" color="text.secondary">
                {"SKILL.md"}
              </Typography>
            }
          />
          <GlassCardContent>
            <Box
              sx={{
                p: 1,
                width: 500,
              }}
            >
              {renderSkillContent()}
            </Box>

            <Box
              sx={{
                p: 1,
                width: 500,
              }}
            >
              <SkillMd />
            </Box>
          </GlassCardContent>
        </GlassCard>
      )}
    </>
  );
};

export default BlueprintSkill;
