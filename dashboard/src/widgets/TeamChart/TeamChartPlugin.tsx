import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import { getAgentGradients } from "../../utils/gradient";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Fab, alpha } from "@mui/material";
import {
  HeaderCard,
  Iconify,
  MediaAvatarCard,
  SideStripeCard,
} from "@canmingir/link/platform/components";

export const teamChartPlugin = {
  id: "teamChart",

  style: ({ style }) => {
    const nodeStyle = style || {};

    return {
      ...nodeStyle,
      nodeWidth: 350,
      nodeHeight: 125,

      lineColor: nodeStyle.teamLineColor ?? nodeStyle.lineColor ?? "#D0D7E2",
      lineWidth: nodeStyle.teamLineWidth ?? nodeStyle.lineWidth ?? 1.5,
      lineStyle: nodeStyle.teamLineStyle ?? nodeStyle.lineStyle ?? "solid",
      connectorType:
        nodeStyle.teamConnectorType ?? nodeStyle.connectorType ?? "normal",
      gap: nodeStyle.teamGap ?? nodeStyle.gap ?? 6,
      levelGap: nodeStyle.teamLevelGap ?? nodeStyle.levelGap ?? 4,
    };
  },

  node: ({ node, title, nodeStyle }) => {
    const nodeSx = nodeStyle.nodeSx || {};
    const width = nodeStyle.nodeWidth ?? 350;
    const height = nodeStyle.nodeHeight ?? 125;

    const isTeam = node.nodeKind === "team";
    const isAgent = node.nodeKind === "agent";
    const isBlueprint = node.nodeKind === "Blueprint";

    const teamLayout =
      nodeStyle.teamLayout ||
      (isTeam ? "gradient" : isBlueprint ? "sideStripe" : "media");

    const onTeamAddAgent = nodeStyle.onTeamAddAgent;
    const onAgentOpen = nodeStyle.onAgentOpen;
    const onBlueprintOpen = nodeStyle.onBlueprintOpen;
    const allAgentIds = nodeStyle.allAgentIds;

    const renderInitialAvatar = () => {
      if (!isAgent) {
        return (
          <Box
            sx={{
              position: "relative",
              height: "100%",
              width: "100%",
            }}
          >
            {["logos:slack-icon", "logos:whatsapp-icon"].map((icon, index) => (
              <Fab
                key={icon}
                color="default"
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  minHeight: "auto",
                  boxShadow: 2,
                  position: "absolute",
                  top: "40%",
                  left: "55%",
                  transform: `translate(-65%, calc(-40% + ${index * 20}px))`,
                }}
              >
                <Iconify icon={icon} />
              </Fab>
            ))}
          </Box>
        );
      }

      return (
        <Iconify
          icon={node?.icon?.replace(/^:|:$/g, "")}
          width="30%"
          height="30%"
          style={{ objectFit: "contain" }}
        />
      );
    };

    if (teamLayout === "media" && isAgent) {
      const handleCardClick = () => {
        if (onAgentOpen) {
          onAgentOpen(node, "profile");
        }
      };

      return (
        <MediaAvatarCard
          sx={{
            minWidth: width,
            maxWidth: width,
            height,
            ...nodeSx,
            "&:hover": {
              boxShadow: (theme) => theme.shadows[3],
            },
            "&::before": (theme) => ({
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: 100,
              height: "100%",
              zIndex: 0,
              background: getAgentGradients(node.id, theme, allAgentIds),
            }),
          }}
          leftContent={renderInitialAvatar()}
          title={
            <Chip
              onClick={handleCardClick}
              label={title || node?.name}
              icon={<Iconify icon="mingcute:location-fill" width={18} />}
              size="small"
              sx={{
                alignSelf: "flex-start",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                color: "white",
                fontWeight: 600,
                fontSize: "0.78rem",
                height: 22,
                mt: -1,
                "& .MuiChip-icon": { color: "white" },
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  "& .MuiChip-icon": { color: "white" },
                },
              }}
            />
          }
          description={<div onClick={handleCardClick}>{node.description}</div>}
          footer={
            onAgentOpen && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAgentOpen(node, "blueprints");
                  }}
                  sx={{ minWidth: 30, width: 30, height: 30, p: 0 }}
                >
                  <Iconify icon="healthicons:crisis-response-center-person-outline" />
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAgentOpen(node, "knowledge-base");
                  }}
                  sx={{ minWidth: 30, width: 30, height: 30, p: 0 }}
                >
                  <Iconify icon="carbon:ibm-watson-knowledge-studio" />
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAgentOpen(node, "tasks");
                  }}
                  sx={{ minWidth: 30, width: 30, height: 30, p: 0 }}
                >
                  <Iconify icon="material-symbols:task" />
                </Button>
              </>
            )
          }
          background={undefined}
        />
      );
    }

    if (teamLayout === "sideStripe" && isBlueprint) {
      const stripeWidth = 100;

      return (
        <SideStripeCard
          sx={{
            width,
            ...nodeSx,
            borderRadius: 1.5,
            "&:hover": {
              transform: "none",
              boxShadow: "none",
            },
            "& .animated-background-selector": (theme) => ({
              background: `linear-gradient(
                135deg,
                ${alpha(theme.palette.grey[600], 0.4)},
                ${alpha(theme.palette.grey[900], 0.6)}
              )`,
            }),
          }}
          stripeContent={renderInitialAvatar()}
          title={title || node?.name}
          description={node?.description}
          footer={
            onBlueprintOpen && (
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onBlueprintOpen(node);
                }}
                sx={{ minWidth: 30, width: 30, height: 30, p: 0 }}
              >
                <EditIcon />
              </Button>
            )
          }
          minWidth={width}
          maxWidth={width}
          height={height}
          stripeWidth={stripeWidth}
        />
      );
    }
    const teamName = node?.name || title || "";
    return (
      <HeaderCard
        sx={{
          width,
          ...nodeSx,
          borderRadius: 1.5,
          "&:hover": {
            transform: "none",
            boxShadow: "none",
            "&:before": { height: "40%" },
          },
        }}
        height={height}
        padding={nodeStyle.teamPadding || 2}
        header={
          <Stack sx={{ height: "100%" }} spacing={1.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 36px",
                alignItems: "center",
              }}
            >
              {node.icon ? (
                <Iconify
                  sx={{
                    width: 28,
                    height: 28,
                    color: "info.main",
                    position: "relative",
                    top: -5,
                  }}
                  icon={node.icon.replace(/^:|:$/g, "")}
                />
              ) : (
                <Box sx={{ width: 36, height: 36 }} />
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  position: "relative",
                  top: -5,
                }}
              >
                <Chip
                  label="Team Leader"
                  size="small"
                  sx={{
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.1),
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                {isTeam && onTeamAddAgent ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTeamAddAgent(node);
                    }}
                    sx={{
                      minWidth: 30,
                      width: 30,
                      height: 30,
                      position: "relative",
                      top: -5,
                    }}
                  >
                    <Iconify icon="ri:user-add-line" />
                  </Button>
                ) : (
                  <Box sx={{ width: 36, height: 36 }} />
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                position: "relative",
                top: 10,
              }}
            >
              <Typography variant="inherit" noWrap>
                {teamName}
              </Typography>
            </Box>
          </Stack>
        }
      />
    );
  },
};
