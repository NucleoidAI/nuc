import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import { cleanIconName } from "../../utils/cleanIconName";
import { getAgentGradients } from "../../utils/gradient";

import {
  CustomPopover,
  Iconify,
  usePopover,
} from "@canmingir/link/platform/components";
import { IconButton, MenuItem, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// ----------------------------------------------------------------------

export default function AgentCard({
  agent,
  onView,
  onEdit,
  onDelete,
  allAgentIds,
}: {
  agent: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    createdAt: string;
    AIEngine?: {
      vendor: string;
      model: string;
    };
  };
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  allAgentIds?: string[];
}) {
  const theme = useTheme();
  const popover = usePopover();

  return (
    <>
      <Card
        sx={{
          width: "255px",
          position: "relative",
          border: `1px solid rgba(22, 28, 36, 0.5)`,
          borderRadius: 2,
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
            transform:
              "perspective(1500px) rotateX(0deg) rotateY(-10deg) rotateZ(0deg)",
            filter: "brightness(1.070)",
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
        <IconButton
          data-cy="agent-card-more-vert"
          onClick={popover.onOpen}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            color: "common.white",
            bgcolor: alpha(theme.palette.grey[900], 0.3),
            "&:hover": {
              bgcolor: alpha(theme.palette.grey[900], 0.5),
            },
          }}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        <Box
          onClick={onView}
          sx={{
            cursor: "pointer",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          data-cy="agent-card"
        >
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                width: "100%",
                pt: "56.25%",
                background: getAgentGradients(agent.id, theme, allAgentIds),
                overflow: "hidden",
              }}
            />

            <Box
              sx={{
                width: 64,
                height: 64,
                position: "absolute",
                bottom: -32,
                left: 0,
                right: 0,
                mx: "auto",
                zIndex: 9,
                borderRadius: "50%",
                bgcolor: "background.paper",
                border: `4px solid ${theme.palette.background.paper}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {agent.icon ? (
                <Iconify
                  icon={cleanIconName(agent.icon)}
                  width={32}
                  height={32}
                />
              ) : (
                <Avatar sx={{ width: "100%", height: "100%" }} />
              )}
            </Box>
          </Box>

          <Stack
            spacing={1.5}
            sx={{
              p: 2,
              pt: 4.5,
              flexGrow: 1,
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography variant="subtitle1" data-cy="agent-card-name">
                {agent.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {agent.createdAt}
              </Typography>
            </Box>

            <Stack
              sx={{
                width: "100%",
                p: 1.5,
                bgcolor: alpha(theme.palette.grey[500], 0.08),
                borderRadius: 1,
                textAlign: "left",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Iconify
                  icon={"ph:note-pencil-duotone"}
                  width={14}
                  color="text.secondary"
                />
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  Description
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                color="text.primary"
                data-cy="agent-card-description-area"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minHeight: 40,
                  fontSize: "0.85rem",
                }}
              >
                {agent.description || "No description provided."}
              </Typography>
            </Stack>

            <Typography
              data-cy="agent-card-generated-by"
              variant="caption"
              color="text.disabled"
              noWrap
              sx={{ maxWidth: "100%" }}
            >
              Generated By {agent.AIEngine?.vendor} {agent.AIEngine?.model}
            </Typography>
          </Stack>
        </Box>
      </Card>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          data-cy="agent-card-menu-view"
          onClick={() => {
            popover.onClose();
            onView();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>

        <MenuItem
          data-cy="agent-card-menu-edit"
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          data-cy="agent-card-menu-delete"
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: "error.main" }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>
    </>
  );
}
