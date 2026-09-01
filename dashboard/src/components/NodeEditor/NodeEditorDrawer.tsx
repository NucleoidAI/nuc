import { DrawerLayout } from "@canmingir/link/layouts";
import ForceStepSwipe from "../ForceStepSwipe/ForceStepSwipe";
import { Iconify } from "@canmingir/link/platform/components";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";

const NodeEditorDrawer = ({
  drawerOpen,
  handleDrawerClose,
  selectedParentNode,
  newNodeLabel,
  setNewNodeLabel,
  newNodeInstructions,
  setNewNodeInstructions,
  newNodePseudocodeEnabled = false,
  setNewNodePseudocodeEnabled,
  pseudocodeLoading = false,
  newNodeForce = false,
  setNewNodeForce,
  newNodeType,
  setNewNodeType,
  selectedBranch,
  setSelectedBranch,
  inheritedNextBranch,
  setInheritedNextBranch,
  hasInheritedNext,
  availableIntegrations,
  searchQuery,
  setSearchQuery,
  selectedIntegration,
  setSelectedIntegration,
  parentIntegration,
  nextIntegration,
  handleSubmit,
  editMode,
  pseudocode,
  availableAgents = [],
  handoffTargetAgentId = "",
  setHandoffTargetAgentId,
  handoffTargetBlueprintId = "",
  setHandoffTargetBlueprintId,
  availableAgentBlueprints = [],
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
  newNodeInstructions: string;
  setNewNodeInstructions: (instructions: string) => void;
  newNodePseudocodeEnabled?: boolean;
  setNewNodePseudocodeEnabled?: (enabled: boolean) => void;
  pseudocodeLoading?: boolean;
  newNodeForce?: boolean;
  setNewNodeForce?: (force: boolean) => void;
  newNodeType: string;
  setNewNodeType: (type: string) => void;
  selectedBranch: "true" | "false";
  setSelectedBranch: (branch: "true" | "false") => void;
  inheritedNextBranch: "true" | "false" | "none";
  setInheritedNextBranch: (branch: "true" | "false" | "none") => void;
  hasInheritedNext: boolean;
  availableIntegrations: Array<{
    id: string;
    action: string;
    provider: string;
    description: string;
    icon: string;
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
    icon: string;
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
    icon: string;
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
    icon: string;
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
    icon: string;
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
  pseudocode?: string;
  availableAgents?: Array<{ id: string; name: string; icon?: string }>;
  handoffTargetAgentId?: string;
  setHandoffTargetAgentId?: (id: string) => void;
  handoffTargetBlueprintId?: string;
  setHandoffTargetBlueprintId?: (id: string) => void;
  availableAgentBlueprints?: Array<{ id: string; title: string }>;
}) => {
  const theme = useTheme();
  const [integrationPage, setIntegrationPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const formFields = (
    <Stack spacing={2}>
      <TextField
        label="Label"
        variant="outlined"
        fullWidth
        value={newNodeLabel}
        onChange={(e) => setNewNodeLabel(e.target.value)}
        autoComplete="off"
        inputProps={{
          autoComplete: "off",
          autoCorrect: "off",
          spellCheck: false,
        }}
        sx={{ mt: 1 }}
      />

      <TextField
        label="Instructions"
        variant="outlined"
        fullWidth
        multiline
        minRows={3}
        value={newNodeInstructions}
        onChange={(e) => {
          setNewNodeInstructions(e.target.value);

          if (!e.target.value.trim() && newNodePseudocodeEnabled) {
            setNewNodePseudocodeEnabled?.(false);
          }
        }}
        autoComplete="off"
        inputProps={{
          autoComplete: "off",
          autoCorrect: "off",
          spellCheck: false,
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Box sx={{ textAlign: "left", flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight="bold">
            Force node
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The platform guarantees this node&apos;s action, regardless of the
            agent.
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <ForceStepSwipe
            checked={!!newNodeForce}
            onChange={(value) => setNewNodeForce?.(value)}
            theme={theme}
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ textAlign: "left", flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Pseudocode
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {newNodeInstructions.trim()
                ? "Generated from the instructions and sent to the agent in their place. Turn off to send the instructions as written."
                : "Write the instructions first to generate pseudocode from them."}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <ForceStepSwipe
              checked={newNodePseudocodeEnabled}
              onChange={(value) => setNewNodePseudocodeEnabled?.(value)}
              theme={theme}
              disabled={!newNodeInstructions.trim() || pseudocodeLoading}
              ariaLabel="Generate pseudocode"
            />
          </Box>
        </Box>

        {newNodePseudocodeEnabled && (
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="text.secondary"
            gutterBottom
            component="pre"
            sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", mt: 1.5 }}
          >
            {pseudocodeLoading
              ? "Generating..."
              : pseudocode && pseudocode.trim()
              ? pseudocode
              : "Not available"}
          </Typography>
        )}
      </Box>

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
          <MenuItem value="HANDOFF">Handoff</MenuItem>
        </Select>
      </FormControl>

      {newNodeType === "HANDOFF" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="handoff-agent-label">Target Agent</InputLabel>
            <Select
              labelId="handoff-agent-label"
              id="handoff-agent-select"
              value={handoffTargetAgentId}
              label="Target Agent"
              onChange={(e) => setHandoffTargetAgentId?.(e.target.value)}
              MenuProps={{
                sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
              }}
            >
              {availableAgents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {availableAgentBlueprints.length > 0 && (
            <FormControl fullWidth>
              <InputLabel id="handoff-blueprint-label">
                Target Blueprint (optional)
              </InputLabel>
              <Select
                labelId="handoff-blueprint-label"
                id="handoff-blueprint-select"
                value={handoffTargetBlueprintId}
                label="Target Blueprint (optional)"
                onChange={(e) => setHandoffTargetBlueprintId?.(e.target.value)}
                MenuProps={{
                  sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
                }}
              >
                <MenuItem value="">
                  <em>None (agent decides)</em>
                </MenuItem>
                {availableAgentBlueprints.map((bp) => (
                  <MenuItem key={bp.id} value={bp.id}>
                    {bp.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

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

      {newNodeType === "CONDITION" && hasInheritedNext && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Continue existing flow on:
          </Typography>
          <ToggleButtonGroup
            value={inheritedNextBranch}
            exclusive
            onChange={(_, val) => val && setInheritedNextBranch(val)}
            fullWidth
            size="small"
          >
            <ToggleButton
              value="true"
              sx={{
                "&.Mui-selected": {
                  bgcolor: "success.main",
                  color: "success.contrastText",
                  "&:hover": { bgcolor: "success.dark" },
                },
              }}
            >
              True
            </ToggleButton>
            <ToggleButton
              value="false"
              sx={{
                "&.Mui-selected": {
                  bgcolor: "error.main",
                  color: "error.contrastText",
                  "&:hover": { bgcolor: "error.dark" },
                },
              }}
            >
              False
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {newNodeType !== "CONDITION" && newNodeType !== "HANDOFF" && (
        <Box>
          {availableIntegrations.length === 0 && !searchQuery ? (
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIntegrationPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
                autoComplete="off"
                inputProps={{
                  autoComplete: "off",
                  autoCorrect: "off",
                  spellCheck: false,
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {availableIntegrations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No integrations found matching &quot;{searchQuery}
                    &quot;
                  </Typography>
                ) : (
                  availableIntegrations
                    .slice(
                      (integrationPage - 1) * ITEMS_PER_PAGE,
                      integrationPage * ITEMS_PER_PAGE
                    )
                    .map((integration) => (
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
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            mb={1}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: "background.neutral",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Iconify
                                icon={integration.icon}
                                width={18}
                                height={18}
                              />
                            </Box>

                            <Typography variant="subtitle2" fontWeight="bold">
                              {integration.action}
                            </Typography>
                          </Stack>

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
              {availableIntegrations.length > ITEMS_PER_PAGE && (
                <Pagination
                  count={Math.ceil(
                    availableIntegrations.length / ITEMS_PER_PAGE
                  )}
                  page={integrationPage}
                  onChange={(_, value) => setIntegrationPage(value)}
                  size="small"
                  sx={{
                    mt: 1,
                    display: "flex",
                    justifyContent: "center",
                  }}
                />
              )}
            </>
          )}
        </Box>
      )}

      {newNodeType !== "CONDITION" &&
        newNodeType !== "HANDOFF" &&
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

      {selectedIntegration?.id &&
        newNodeType !== "CONDITION" &&
        newNodeType !== "HANDOFF" && (
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

      <Button
        size="large"
        variant="contained"
        onClick={handleSubmit}
        disabled={
          !newNodeLabel ||
          (newNodeType === "HANDOFF" && !handoffTargetAgentId) ||
          (newNodeType !== "CONDITION" &&
            newNodeType !== "HANDOFF" &&
            !selectedIntegration?.id)
        }
      >
        {editMode ? "Edit Node" : "Add Node"}
      </Button>
    </Stack>
  );

  return (
    <DrawerLayout
      open={drawerOpen}
      onClose={handleDrawerClose}
      mode="narrow"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      title={
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ pr: 6 }}
        >
          <Typography variant="h6">
            {editMode ? "Edit Node" : "Add New Node"}
          </Typography>
        </Box>
      }
    >
      <Box data-cy="node-editor-drawer">{formFields}</Box>
    </DrawerLayout>
  );
};

export default NodeEditorDrawer;
