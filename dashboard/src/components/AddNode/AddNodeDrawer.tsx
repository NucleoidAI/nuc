import CloseIcon from "@mui/icons-material/Close";
import React from "react";

import {
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const AddNodeDrawer = ({
  drawerOpen,
  handleDrawerClose,
  selectedParentNode,
  newNodeLabel,
  setNewNodeLabel,
  newNodeType,
  setNewNodeType,
  handleSubmit,
}: {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
  selectedParentNode: {
    id: string;
    label?: string;
  };
  newNodeLabel: string;
  setNewNodeLabel: (label: string) => void;
  newNodeType: string;
  setNewNodeType: (type: string) => void;
  handleSubmit: () => void;
}) => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={handleDrawerClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
      }}
      PaperProps={{
        sx: { width: isMobile ? "100%" : 400, padding: 3 },
      }}
    >
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add New Node</Typography>
          <IconButton onClick={handleDrawerClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Parent Node:
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {selectedParentNode?.label || selectedParentNode?.id || "Unknown"}
          </Typography>
        </Box>

        <TextField
          label="Label"
          variant="outlined"
          fullWidth
          value={newNodeLabel}
          onChange={(e) => setNewNodeLabel(e.target.value)}
        />

        <FormControl fullWidth>
          <InputLabel id="node-type-label">Type</InputLabel>
          <Select
            labelId="node-type-label"
            id="node-type-select"
            value={newNodeType}
            label="Type"
            onChange={(e) => setNewNodeType(e.target.value)}
            MenuProps={{
              sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
            }}
          >
            <MenuItem value="NORMAL">Normal</MenuItem>
            <MenuItem value="CONDITION">Condition</MenuItem>
          </Select>
        </FormControl>

        <Button
          size="large"
          variant="contained"
          onClick={handleSubmit}
          disabled={!newNodeLabel}
        >
          Submit
        </Button>
      </Stack>
    </Drawer>
  );
};

export default AddNodeDrawer;
