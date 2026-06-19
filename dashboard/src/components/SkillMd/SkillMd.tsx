import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Iconify } from "@canmingir/link/platform/components";
import { isValidIntegration } from "../../widgets/NodeEditorWidget/helper";
import useMCPs from "../../hooks/useMCPs";

import {
  Box,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";

type SkillMdType = {
  id: string;
  name: string;
  icon: string;
  summary: string;
  content: string;
  action?: string;
  description?: string;
};

const SkillMd = () => {
  const theme = useTheme();
  const [selectedSkill, setSelectedSkill] = useState<SkillMdType | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { getMCPs, getActions } = useMCPs();

  const { mcps } = getMCPs();
  const { actions } = getActions();

  const transformedActions = Array.isArray(actions?.content?.actions)
    ? actions.content.actions
        .filter((action) => action.action !== "PLATFORM:decision")
        .map((action) => ({
          id: action.action,
          action: action.action,
          provider: "PLATFORM",
          description:
            action.description || action.action.replace("PLATFORM:", ""),
          icon: action.icon || "",
          direction: "internal",
          lib: action.lib || "",
          inputSchema: action.inputSchema || {
            type: "object",
            properties: {},
          },
          outputSchema: {
            type: "object",
            properties: {},
          },
        }))
    : [];

  const integrationsList = Array.isArray(mcps?.content.mcps)
    ? mcps.content.mcps.filter(isValidIntegration)
    : [];

  const allIntegrations = [...transformedActions, ...integrationsList];

  const handleClose = () => setSelectedSkill(null);

  return (
    <Box sx={{ width: "100%" }}>
      <ListItemButton
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <ListItemText
          primary={`Tools (${allIntegrations.length})`}
          primaryTypographyProps={{ fontWeight: 600 }}
        />
        <ExpandMoreIcon
          sx={{
            transition: "transform 0.2s ease-in-out",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </ListItemButton>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List
          disablePadding
          sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}
        >
          {allIntegrations.map((skill) => (
            <ListItemButton
              key={skill.id}
              onClick={() => setSelectedSkill(skill)}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: theme.palette.primary.main + "60",
                  backgroundColor: theme.palette.primary.main + "08",
                },
              }}
            >
              <ListItemIcon
                sx={{ minWidth: 36, color: theme.palette.primary.main }}
              >
                <Iconify icon={skill.icon} />
              </ListItemIcon>
              <ListItemText
                primary={skill.action}
                secondary={skill.description}
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>

      <Dialog
        open={Boolean(selectedSkill)}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        sx={{
          zIndex: 10000000,
        }}
      >
        <DialogTitle
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: "1.25rem",
            fontWeight: 600,
          }}
        >
          {selectedSkill && (
            <Iconify
              icon={selectedSkill.icon}
              sx={{ color: theme.palette.primary.main }}
            />
          )}
          {selectedSkill?.action}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ ml: "auto" }}
            aria-label="close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography
            component="pre"
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              m: 0,
              color: theme.palette.text.primary,
            }}
          >
            {selectedSkill?.description}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SkillMd;
