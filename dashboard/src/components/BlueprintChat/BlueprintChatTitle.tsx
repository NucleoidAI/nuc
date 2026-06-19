import AddIcon from "@mui/icons-material/Add";
import { BlueprintCommands } from "../ChatInput/chat.config";
import BulletDescription from "../BulletDescription/BulletDescription";
import EditIcon from "@mui/icons-material/Edit";
import SkillMd from "../SkillMd/SkillMd";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  Iconify,
} from "@canmingir/link/platform/components";
import { MCPElement, MCPScopeElement } from "./MCPElement";
import React, { useState } from "react";

const BlueprintChatTitle = ({
  title,
  description,
  descriptionLoading,
  setTitle,
  showKnowledge,
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const highlightText = (text) => {
    try {
      const availableMCPs = BlueprintCommands[0]?.next?.list || [];
      const availableScopes = [];

      availableMCPs.forEach((mcp) => {
        if (mcp.next?.list) {
          mcp.next.list.forEach((scope) => {
            availableScopes.push({
              ...scope,
              parentMCP: mcp,
            });
          });
        }
      });

      const matches = [];
      const modifiedDescription = text;

      availableMCPs.forEach((mcp) => {
        const regex = new RegExp(`\\b${mcp.name}\\b`, "gi");
        const mcpMatches = modifiedDescription.match(regex);
        if (mcpMatches) {
          mcpMatches.forEach((match) => {
            matches.push({
              text: match,
              type: "mcp",
              data: mcp,
              index: modifiedDescription
                .toLowerCase()
                .indexOf(match.toLowerCase()),
            });
          });
        }
      });

      availableScopes.forEach((scope) => {
        const regex = new RegExp(`\\b${scope.name}\\b`, "gi");
        const scopeMatches = modifiedDescription.match(regex);
        if (scopeMatches) {
          scopeMatches.forEach((match) => {
            matches.push({
              text: match,
              type: "scope",
              data: scope,
              index: modifiedDescription
                .toLowerCase()
                .indexOf(match.toLowerCase()),
            });
          });
        }
      });

      if (matches.length > 0) {
        matches.sort((a, b) => a.index - b.index);

        const parts = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const currentIndex = modifiedDescription
            .toLowerCase()
            .indexOf(match.text.toLowerCase(), lastIndex);

          if (currentIndex > lastIndex) {
            parts.push(modifiedDescription.substring(lastIndex, currentIndex));
          }

          parts.push(match);

          lastIndex = currentIndex + match.text.length;
        });

        if (lastIndex < modifiedDescription.length) {
          parts.push(modifiedDescription.substring(lastIndex));
        }

        return (
          <>
            {parts.map((part, index) => {
              if (typeof part === "object" && part.type === "mcp") {
                return (
                  <MCPElement key={`desc-mcp-${index}`}>
                    <Iconify icon={part.data.icon} sx={{ mr: 1 }} />
                    {part.data.name}
                  </MCPElement>
                );
              } else if (typeof part === "object" && part.type === "scope") {
                return (
                  <MCPScopeElement key={`desc-scope-${index}`}>
                    <Iconify icon={part.data.icon} />
                    {part.data.name}
                  </MCPScopeElement>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </>
        );
      }

      return text;
    } catch (error) {
      return text;
    }
  };

  const renderDescriptionContent = () => {
    if (!description && !descriptionLoading) return null;

    return (
      <Box>
        {description && (
          <BulletDescription
            description={description}
            renderItem={highlightText}
          />
        )}
        {descriptionLoading && (
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

  const renderTitleContent = () => {
    if (!title) return "Add Title";

    try {
      const availableMCPs = BlueprintCommands[0]?.next?.list || [];
      const availableScopes = [];

      availableMCPs.forEach((mcp) => {
        if (mcp.next?.list) {
          mcp.next.list.forEach((scope) => {
            availableScopes.push({
              ...scope,
              parentMCP: mcp,
            });
          });
        }
      });

      const matches = [];
      const modifiedTitle = title;

      availableMCPs.forEach((mcp) => {
        const regex = new RegExp(`\\b${mcp.name}\\b`, "gi");
        const mcpMatches = modifiedTitle.match(regex);
        if (mcpMatches) {
          mcpMatches.forEach((match) => {
            matches.push({
              text: match,
              type: "mcp",
              data: mcp,
              index: modifiedTitle.toLowerCase().indexOf(match.toLowerCase()),
            });
          });
        }
      });

      availableScopes.forEach((scope) => {
        const regex = new RegExp(`\\b${scope.name}\\b`, "gi");
        const scopeMatches = modifiedTitle.match(regex);
        if (scopeMatches) {
          scopeMatches.forEach((match) => {
            matches.push({
              text: match,
              type: "scope",
              data: scope,
              index: modifiedTitle.toLowerCase().indexOf(match.toLowerCase()),
            });
          });
        }
      });

      if (matches.length > 0) {
        matches.sort((a, b) => a.index - b.index);

        const parts = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const currentIndex = modifiedTitle
            .toLowerCase()
            .indexOf(match.text.toLowerCase(), lastIndex);

          if (currentIndex > lastIndex) {
            parts.push(modifiedTitle.substring(lastIndex, currentIndex));
          }

          parts.push(match);

          lastIndex = currentIndex + match.text.length;
        });

        if (lastIndex < modifiedTitle.length) {
          parts.push(modifiedTitle.substring(lastIndex));
        }

        return (
          <>
            {parts.map((part, index) => {
              if (typeof part === "object" && part.type === "mcp") {
                return (
                  <MCPElement key={`title-mcp-${index}`}>
                    <Iconify icon={part.data.icon} sx={{ mr: 1 }} />
                    {part.data.name}
                  </MCPElement>
                );
              } else if (typeof part === "object" && part.type === "scope") {
                return (
                  <MCPScopeElement key={`title-scope-${index}`}>
                    <Iconify icon={part.data.icon} sx={{ mr: 1 }} />
                    {part.data.name}
                  </MCPScopeElement>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </>
        );
      }

      return title;
    } catch (error) {
      return title || "Add Title";
    }
  };

  return (
    <Box>
      <GlassCard>
        <GlassCardHeader
          sx={{
            p: 1.5,
            width: 500,
          }}
          title={renderTitleContent()}
          action={
            <IconButton
              onClick={handleEditClick}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main + "10",
                border: `1px solid ${theme.palette.primary.main}20`,
                color: theme.palette.primary.main,
                borderRadius: 1.5,
                width: 36,
                height: 36,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: theme.palette.primary.main + "20",
                  borderColor: theme.palette.primary.main + "40",
                },
              }}
            >
              {title ? (
                <EditIcon fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )}
            </IconButton>
          }
        />
      </GlassCard>
      {!showKnowledge && (
        <GlassCard sx={{ mt: 1 }}>
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
              {renderDescriptionContent()}
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
      <Dialog
        open={isEditing}
        onClose={handleCancelClick}
        fullWidth
        maxWidth="sm"
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 2,
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(4px)",
            },
          },

          paper: {
            sx: {
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              backdropFilter: "blur(20px)",
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontSize: "1.25rem",
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {"Edit Blueprint Title & Description"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            onChange={(e) => setTitle(e.target.value)}
            value={title || ""}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.palette.background.default + "50",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main + "80",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 2,
                  borderColor: theme.palette.primary.main,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: theme.palette.primary.main,
              },
            }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={handleCancelClick}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              "&:hover": {
                borderColor: theme.palette.text.secondary,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveClick}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: theme.shadows[3],
              "&:hover": {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                boxShadow: theme.shadows[1],
                color: "white",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlueprintChatTitle;
