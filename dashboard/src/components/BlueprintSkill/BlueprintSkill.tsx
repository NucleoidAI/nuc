import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

import React from "react";
import ToolsWidget from "../../widgets/ToolsWidget/ToolsWidget";

import {
  Box,
  CircularProgress,
  Collapse,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";
import {
  GlassCard,
  GlassCardContent,
} from "@canmingir/link/platform/components";

const BlueprintSkill = ({
  skill,
  skillLoading,
  showKnowledge,
  blueprintId,
  nodes,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  const renderSkillContent = () => {
    if (!skill && !skillLoading) return null;

    return (
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        {skill && <MarkdownRenderer>{skill}</MarkdownRenderer>}
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
        <GlassCard sx={{ mt: -0.5 }}>
          <GlassCardContent>
            <Box
              sx={{
                p: 1,
                width: 500,
              }}
            >
              <ListItemButton
                onClick={() => setExpanded((prev) => !prev)}
                sx={{
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <ListItemText
                  primary="SKILL.md"
                  slotProps={{ primary: { fontWeight: 600 } }}
                />
                <ExpandMoreIcon
                  sx={{
                    transition: "transform 0.2s ease-in-out",
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </ListItemButton>

              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ pt: 1 }}>{renderSkillContent()}</Box>
              </Collapse>
            </Box>

            <Box
              sx={{
                p: 1,
                width: 500,
              }}
            >
              <ToolsWidget blueprintId={blueprintId} nodes={nodes} />
            </Box>
          </GlassCardContent>
        </GlassCard>
      )}
    </>
  );
};

export default BlueprintSkill;
