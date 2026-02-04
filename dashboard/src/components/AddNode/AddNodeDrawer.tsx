import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import SearchIcon from "@mui/icons-material/Search";

import {
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
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
  selectedBranch,
  setSelectedBranch,
  availableIntegrations,
  searchQuery,
  setSearchQuery,
  selectedIntegration,
  setSelectedIntegration,
  parentIntegration,
  nextIntegration,
  handleSubmit,
  editMode,
}: {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
  selectedParentNode: {
    id: string;
    label?: string;
    action?: string;
    nodeType?: string;
    next?: string | string[];
    trueNext?: string[];
    falseNext?: string[];
  };
  newNodeLabel: string;
  setNewNodeLabel: (label: string) => void;
  newNodeType: string;
  setNewNodeType: (type: string) => void;
  selectedBranch: "true" | "false";
  setSelectedBranch: (branch: "true" | "false") => void;
  availableIntegrations: Array<{
    id: string;
    action: string;
    provider: string;
    description: string;
    direction: string;
    lib: string;
    inputSchema: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
    outputSchema?: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
  }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedIntegration: {
    id: string;
    action: string;
    provider: string;
    description: string;
    direction: string;
    lib: string;
    inputSchema: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
        }
      >;
    };
    outputSchema?: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
        }
      >;
    };
  };
  setSelectedIntegration: (integration: {
    id: string;
    action: string;
    provider: string;
    description: string;
    direction: string;
    lib: string;
    inputSchema: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
        }
      >;
    };
    outputSchema?: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
        }
      >;
    };
  }) => void;
  parentIntegration: {
    id: string;
    action: string;
    provider: string;
    description: string;
    direction: string;
    lib: string;
    inputSchema: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
    outputSchema?: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
  };
  nextIntegration: {
    id: string;
    action: string;
    provider: string;
    description: string;
    direction: string;
    lib: string;
    inputSchema: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
    outputSchema?: {
      type?: string;
      properties?: Record<
        string,
        {
          type: string;
          description?: string;
          nullable?: boolean;
        }
      >;
    };
  };
  handleSubmit: () => void;
  editMode?: boolean;
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
        sx: { width: isMobile ? "100%" : 450, padding: 3 },
      }}
    >
      <Stack spacing={2}>
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

        {selectedParentNode?.nodeType === "CONDITION" && (
          <FormControl fullWidth>
            <InputLabel id="branch-label">Branch</InputLabel>
            <Select
              labelId="branch-label"
              id="branch-select"
              value={selectedBranch}
              label="Branch"
              onChange={(e) =>
                setSelectedBranch(e.target.value as "true" | "false")
              }
              MenuProps={{
                sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
              }}
            >
              <MenuItem value="true">True Branch</MenuItem>
              <MenuItem value="false">False Branch</MenuItem>
            </Select>
          </FormControl>
        )}

        {newNodeType !== "CONDITION" && (
          <Box>
            {availableIntegrations.length === 0 ? (
              <></>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Select Integration
                </Typography>
                <TextField
                  placeholder="Search integrations..."
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <Box
                  sx={{
                    minHeight: 500,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {availableIntegrations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No integrations found matching {searchQuery}
                    </Typography>
                  ) : (
                    availableIntegrations.map((integration) => (
                      <Card
                        key={integration.id}
                        variant="outlined"
                        sx={{
                          cursor: "pointer",
                          border:
                            selectedIntegration?.id === integration.id
                              ? `2px solid ${theme.palette.primary.main}`
                              : "1px solid",
                          borderColor:
                            selectedIntegration?.id === integration.id
                              ? "background.default"
                              : "divider",
                          bgcolor:
                            selectedIntegration?.id === integration.id
                              ? "action.selected"
                              : "background.paper",
                        }}
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {integration.action}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mb: 0.5 }}
                          >
                            {integration.provider}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {integration.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </>
            )}
          </Box>
        )}

        {newNodeType !== "CONDITION" &&
          (parentIntegration || nextIntegration) && (
            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.default",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Data Flow Context
              </Typography>

              {parentIntegration?.outputSchema?.properties && (
                <Box sx={{ mb: nextIntegration ? 2 : 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="primary"
                    gutterBottom
                  >
                    Parent Node: {parentIntegration.action}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    Output (available data):
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {Object.entries(
                      parentIntegration.outputSchema.properties
                    ).map(
                      ([key, value]: [
                        string,
                        {
                          type: string;
                          description?: string;
                          nullable?: boolean;
                        }
                      ]) => (
                        <Box key={key} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" component="span">
                            <strong>{key}:</strong>{" "}
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                            >
                              {value.type}
                              {value.description && ` - ${value.description}`}
                            </Typography>
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                </Box>
              )}

              {nextIntegration?.inputSchema?.properties && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="error"
                    gutterBottom
                  >
                    Next Node: {nextIntegration.action}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    Input (required data):
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {Object.entries(nextIntegration.inputSchema.properties).map(
                      ([key, value]: [
                        string,
                        {
                          type: string;
                          description?: string;
                          nullable?: boolean;
                        }
                      ]) => (
                        <Box key={key} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" component="span">
                            <strong>{key}:</strong>{" "}
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                            >
                              {value.type}
                              {value.description && ` - ${value.description}`}
                            </Typography>
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

        {selectedIntegration?.id && newNodeType !== "CONDITION" && (
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Selected Integration Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                {selectedIntegration.action}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedIntegration.description}
              </Typography>
            </Box>

            {selectedIntegration.inputSchema?.properties && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Input Schema
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {Object.entries(
                    selectedIntegration.inputSchema.properties
                  ).map(
                    ([key, value]: [
                      string,
                      { type: string; description?: string; nullable?: boolean }
                    ]) => (
                      <Box key={key} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" component="span">
                          <strong>{key}:</strong>{" "}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {value.type}
                            {value.description && ` - ${value.description}`}
                          </Typography>
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}

            {selectedIntegration.outputSchema?.properties && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Output Schema
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {Object.entries(
                    selectedIntegration.outputSchema.properties
                  ).map(
                    ([key, value]: [
                      string,
                      { type: string; description?: string; nullable?: boolean }
                    ]) => (
                      <Box key={key} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" component="span">
                          <strong>{key}:</strong>{" "}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {value.type}
                            {value.description && ` - ${value.description}`}
                          </Typography>
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Button
          size="large"
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !newNodeLabel ||
            (newNodeType !== "CONDITION" && !selectedIntegration?.id)
          }
        >
          {editMode ? "Edit Node" : "Add Node"}
        </Button>
      </Stack>
    </Drawer>
  );
};

export default AddNodeDrawer;
