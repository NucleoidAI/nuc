import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { BlueprintFlowMiniPreview } from "./BlueprintFlowMiniPreview";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SourcedAvatar from "../SourcedAvatar/SourcedAvatar";
import TaskIcon from "@mui/icons-material/Task";

import {
  Box,
  Card,
  Fab,
  IconButton,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  CustomPopover,
  Iconify,
  usePopover,
} from "@canmingir/link/platform/components";

const BlueprintCard = ({
  item,
  handleDrawerOpen,
  handleFlowDialogOpen,
  removeBlueprint,
  agentId,
}) => {
  const popover = usePopover();

  return (
    <Card key={item.id} sx={{ width: "60%", margin: "0 auto", mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          justifyContent: "center",
          position: "relative",
          gap: 1,
          borderRadius: 5,
          padding: 3,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: 22,
            top: 18,
          }}
        >
          <Fab
            data-cy="Blueprint-more-vert"
            color="default"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              boxShadow: 2,
              border: "1px solid",
              borderColor: "rgba(0, 0, 0, 0.23)",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <IconButton onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Fab>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: 4,
              paddingBottom: 2,
            }}
          >
            <SourcedAvatar
              sx={{
                width: 36,
                height: 36,
                mb: 1,
                bgcolor: "primary.main",
              }}
            >
              <TaskIcon />
            </SourcedAvatar>

            <ListItemText
              primary={<Typography color="inherit">{item.title}</Typography>}
              secondary={item.description}
              slotProps={{
                primary: {
                  typography: "subtitle1",
                },

                secondary: {
                  mt: 1,
                  color: "text.disabled",
                },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: 78,
            bottom: 12,
          }}
        >
          <Fab
            color="default"
            data-cy="flow-icon"
            onClick={() => handleFlowDialogOpen(item)}
          >
            <AccountTreeIcon />
          </Fab>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: 28,
            bottom: 12,
          }}
        >
          <Fab
            color="default"
            data-cy="edit-icon"
            onClick={() => handleDrawerOpen(item)}
          >
            <EditIcon />
          </Fab>
        </Box>
      </Box>

      {/* Flow preview */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          height: 200,
          cursor: "pointer",
          opacity: 0.6,
        }}
        onClick={() => handleFlowDialogOpen(item)}
      >
        <BlueprintFlowMiniPreview blueprintId={item.id} />
      </Box>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="left-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          data-cy="Blueprint-menu-view"
          onClick={() => {
            popover.onClose();
            handleFlowDialogOpen(item);
          }}
        >
          <AccountTreeIcon />
          Flow
        </MenuItem>

        <MenuItem
          data-cy="Blueprint-menu-edit"
          onClick={() => {
            popover.onClose();
            handleDrawerOpen(item);
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          data-cy="Blueprint-menu-delete"
          onClick={() => {
            removeBlueprint(item.id, agentId);
            popover.onClose();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon />
          Delete
        </MenuItem>
      </CustomPopover>
    </Card>
  );
};

export default BlueprintCard;
