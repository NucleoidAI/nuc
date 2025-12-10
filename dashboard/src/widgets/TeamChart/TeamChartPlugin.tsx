import EditIcon from "@mui/icons-material/Edit";
import React from "react";
import SourcedAvatar from "../../components/SourcedAvatar/SourcedAvatar";
import WorkIcon from "@mui/icons-material/Work";
import { alpha } from "@mui/material";

import {
  AvatarRoleCard,
  HeaderCard,
  Iconify,
  MediaAvatarCard,
  SideStripeCard,
} from "@canmingir/link/platform/components";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";

export const teamChartPlugin = {
  id: "teamChart",

  resolveStyle: ({ style }) => {
    const nodeStyle = style || {};

    return {
      ...nodeStyle,

      nodeWidth: 300,
      nodeHeight: 120,

      lineColor: nodeStyle.teamLineColor ?? nodeStyle.lineColor ?? "#D0D7E2",
      lineWidth: nodeStyle.teamLineWidth ?? nodeStyle.lineWidth ?? 1.5,
      lineStyle: nodeStyle.teamLineStyle ?? nodeStyle.lineStyle ?? "solid",
      connectorType:
        nodeStyle.teamConnectorType ?? nodeStyle.connectorType ?? "default",
      gap: nodeStyle.teamGap ?? nodeStyle.gap ?? 6,
      levelGap: nodeStyle.teamLevelGap ?? nodeStyle.levelGap ?? 4,
    };
  },

  renderNode: ({ node, title, subtitle, nodeStyle }) => {
    const nodeSx = nodeStyle.nodeSx || {};
    const baseWidth = nodeStyle.nodeWidth ?? 260;
    const baseHeight = nodeStyle.nodeHeight ?? 120;

    let width = baseWidth;
    let height = baseHeight;

    if (node?.nodeKind === "team") {
      width = baseWidth;
      height = baseHeight + 20;
    }

    const isTeam = node.nodeKind === "team";
    const isColleague = node.nodeKind === "colleague";
    const isResponsibility = node.nodeKind === "responsibility";

    const teamLayout =
      nodeStyle.teamLayout ||
      (isTeam ? "gradient" : isResponsibility ? "sideStripe" : "media");

    const onTeamAddColleague = nodeStyle.onTeamAddColleague;
    const onColleagueGoToPage = nodeStyle.onColleagueGoToPage;
    const onResponsibilityOpen = nodeStyle.onResponsibilityOpen;

    const renderInitialAvatar = () => {
      if (!isColleague) {
        const initial = (title || node?.name || "?").charAt(0).toUpperCase();
        return (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.contrastText",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {initial}
          </Box>
        );
      }

      return (
        <SourcedAvatar
          name={node.name}
          source={node.coach ? node.icon : "MINIMAL"}
          iconUrl={node.icon}
          sx={{ width: 48, height: 48, borderRadius: "50%", zIndex: 1 }}
        />
      );
    };

    const isManager = node.nodeKind === "manager" || node.id === "manager-root";

    if (isManager) {
      return (
        <AvatarRoleCard
          sx={{
            width,
            height,
            ...nodeSx,
          }}
          leftContent={
            <SourcedAvatar
              name={node.name}
              source={node.icon || "MINIMAL"}
              iconUrl={node.icon}
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
              }}
            />
          }
          topRightContent={
            node.role ? (
              <Chip
                label={node.role}
                size="small"
                sx={(theme) => ({
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  "&:hover": {
                    color: theme.palette.background.paper,
                  },
                })}
              />
            ) : null
          }
          bottomContent={
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              {node.name}
            </Typography>
          }
        />
      );
    }

    if (
      teamLayout === "media" &&
      (isColleague || (!isTeam && !isResponsibility))
    ) {
      return (
        <MediaAvatarCard
          sx={{
            minWidth: width,
            maxWidth: width,
            height,
            ...nodeSx,
          }}
          leftContent={renderInitialAvatar()}
          rightContent={
            <Stack
              direction="column"
              sx={{
                flex: 1,
                width: "100%",
                height: "100%",
                py: 1,
                justifyContent: "space-between",
              }}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  gap={1}
                  alignItems="center"
                  sx={{ mt: 0.5 }}
                >
                  <Chip
                    label={title || node?.name}
                    icon={<Iconify icon="mingcute:location-fill" width={20} />}
                    size="small"
                    sx={{
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      "& .MuiChip-icon": {
                        color: "white",
                      },
                      "&:hover": {
                        color: (theme) => theme.palette.background.paper,
                        "& .MuiChip-icon": {
                          color: (theme) => theme.palette.background.paper,
                        },
                      },
                    }}
                  />
                </Stack>

                {node?.role && (
                  <Stack direction="row" gap={1} alignItems="center">
                    <Chip
                      label={node.role}
                      icon={
                        <Iconify icon="ic:round-business-center" width={20} />
                      }
                      size="small"
                      sx={{
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.1),
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        "& .MuiChip-icon": {
                          color: "white",
                        },
                        "&:hover": {
                          color: (theme) => theme.palette.background.paper,
                          "& .MuiChip-icon": {
                            color: (theme) => theme.palette.background.paper,
                          },
                        },
                      }}
                    />
                  </Stack>
                )}
              </Stack>

              {isColleague && onColleagueGoToPage && (
                <Box
                  sx={{
                    mt: 0.5,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      onColleagueGoToPage(node);
                    }}
                  >
                    <WorkIcon />
                  </Button>
                </Box>
              )}
            </Stack>
          }
          background={nodeStyle.teamBackground || node.background}
          overlayColor={nodeStyle.teamOverlayColor}
        />
      );
    }

    if (teamLayout === "sideStripe" && isResponsibility) {
      return (
        <SideStripeCard
          sx={nodeSx}
          stripeContent={renderInitialAvatar()}
          mainContent={
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                py: 1,
              }}
            >
              <Box>
                <Typography
                  className="responsibility-title"
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: 13,
                    mb: subtitle ? 0.5 : 0,
                  }}
                >
                  {title || node?.name}
                </Typography>

                {node?.description && (
                  <Typography
                    className="responsibility-description"
                    variant="caption"
                    sx={{ opacity: 0.8 }}
                  >
                    {node.description}
                  </Typography>
                )}
              </Box>

              {onResponsibilityOpen && (
                <Box
                  sx={{
                    mt: 0.5,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResponsibilityOpen(node);
                    }}
                  >
                    <EditIcon />
                  </Button>
                </Box>
              )}
            </Box>
          }
          minWidth={width}
          maxWidth={width}
          height={height}
          stripeWidth={nodeStyle.teamStripeWidth || 65}
        />
      );
    }

    const teamName = node?.name || title || "";
    const coachName = node?.coach || "";
    const icon = node?.icon;

    return (
      <HeaderCard
        sx={{
          width,
          ...nodeSx,
        }}
        height={height}
        padding={nodeStyle.teamPadding || 2}
        header={
          <Stack
            spacing={2}
            sx={{
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              {icon ? (
                <Iconify
                  sx={{
                    mr: 2,
                    mb: 1,
                    width: 36,
                    height: 36,
                    color: "info.main",
                  }}
                  icon={icon.replace(/^:|:$/g, "")}
                />
              ) : (
                <Box sx={{ width: 36, height: 36 }} />
              )}

              <Stack direction="row" spacing={1} alignItems="center">
                {coachName && (
                  <Chip
                    label={`Team Leader: ${coachName}`}
                    size="small"
                    sx={{
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                      "&:hover": {
                        color: (theme) => theme.palette.background.paper,
                      },
                    }}
                  />
                )}

                {isTeam && onTeamAddColleague && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTeamAddColleague(node);
                    }}
                  >
                    <Iconify icon="ri:user-add-line" />
                  </Button>
                )}
              </Stack>
            </Stack>

            <Stack spacing={1} alignItems="center">
              <Typography
                sx={{
                  color: "text.primary",
                  fontWeight: "bold",
                  lineHeight: 1.2,
                }}
              >
                {teamName}
              </Typography>
            </Stack>
          </Stack>
        }
      />
    );
  },
};
