import { DrawerLayout } from "@canmingir/link/layouts";
import PseudocodeViewer from "./PseudocodeViewer";
import SearchIcon from "@mui/icons-material/Search";
import { isBranchNodeType } from "../BlueprintFlow/helper";
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
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import { Iconify, LinkSwipe } from "@canmingir/link/platform/components";
import NodeInputValues, { getInputError } from "./NodeInputValues";

const NodeEditorDrawer = ({
  parameters = {},
  onParametersChange,
  drawerOpen,
  handleDrawerClose,
  selectedParentNode,
  newNodeLabel,
  setNewNodeLabel,
  newNodeInstructions,
  setNewNodeInstructions,
  newNodeQuestion = "",
  setNewNodeQuestion,
  newNodeDescription = "",
  setNewNodeDescription,
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
  parameters?: Record<string, unknown>;
  onParametersChange?: (parameters: Record<string, unknown>) => void;
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
  newNodeQuestion?: string;
  setNewNodeQuestion?: (question: string) => void;
  newNodeDescription?: string;
  setNewNodeDescription?: (description: string) => void;
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
  const [activeTab, setActiveTab] = useState<"node" | "details" | "params">(
    "node"
  );
  const ITEMS_PER_PAGE = 3;

  const isApprovalNode = newNodeType === "APPROVAL";
  const isParentBranch = isBranchNodeType(selectedParentNode?.nodeType);
  const isParentApproval = selectedParentNode?.nodeType === "APPROVAL";
  const usesIntegration =
    !isBranchNodeType(newNodeType) && newNodeType !== "HANDOFF";

  const descriptionPlaceholder =
    newNodeType === "CONDITION"
      ? "A decision node that branches the flow based on conditions."
      : isApprovalNode
      ? "Waits for the customer to approve or reject before continuing."
      : newNodeType === "HANDOFF"
      ? "Transfer this task to another agent's blueprint."
      : selectedIntegration?.description || "";

  const nodeFields = (
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
        label="Description"
        variant="outlined"
        fullWidth
        multiline
        minRows={2}
        value={newNodeDescription}
        onChange={(e) => setNewNodeDescription?.(e.target.value)}
        placeholder={descriptionPlaceholder}
        autoComplete="off"
        inputProps={{
          autoComplete: "off",
          autoCorrect: "off",
          spellCheck: false,
        }}
      />

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Pseudocode
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <LinkSwipe
              checked={newNodePseudocodeEnabled}
              onChange={(value) => setNewNodePseudocodeEnabled?.(value)}
              theme={theme}
              color="primary"
              variant="solid"
              disabled={pseudocodeLoading}
              ariaLabel="Generate pseudocode"
              height={30}
              width={90}
            />
          </Box>
        </Box>

        <TextField
          sx={{ mt: 2 }}
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

        {newNodePseudocodeEnabled && !pseudocodeLoading && (
          <Box sx={{ mt: 1 }}>
            {pseudocode && pseudocode.trim() ? (
              <PseudocodeViewer code={pseudocode} />
            ) : null}
          </Box>
        )}
      </Box>

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
            The platform guarantees this node&apos;s action.
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <LinkSwipe
            checked={!!newNodeForce}
            onChange={(value) => setNewNodeForce?.(value)}
            theme={theme}
            ariaLabel="Force node"
            height={50}
            thumbIcon="⚡️"
          />
        </Box>
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
          <MenuItem value="APPROVAL">Customer Approval</MenuItem>
          <MenuItem value="HANDOFF">Handoff</MenuItem>
        </Select>
      </FormControl>

      {isApprovalNode && (
        <TextField
          label="Approval message"
          variant="outlined"
          fullWidth
          multiline
          minRows={2}
          value={newNodeQuestion}
          onChange={(e) => setNewNodeQuestion?.(e.target.value)}
          placeholder="Shall I place the order? Please approve or reject."
          helperText="Sent to the customer while the flow waits for a decision. Leave empty to have it written from the instructions and the live task data."
          autoComplete="off"
          inputProps={{
            autoComplete: "off",
            autoCorrect: "off",
            spellCheck: false,
          }}
        />
      )}

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

      {isParentBranch && (
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
            <MenuItem value="true">
              {isParentApproval ? "Approved Branch" : "True Branch"}
            </MenuItem>
            <MenuItem value="false">
              {isParentApproval ? "Rejected Branch" : "False Branch"}
            </MenuItem>
          </Select>
        </FormControl>
      )}

      {isBranchNodeType(newNodeType) && hasInheritedNext && (
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
              {isApprovalNode ? "Approved" : "True"}
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
              {isApprovalNode ? "Rejected" : "False"}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {usesIntegration && (
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
    </Stack>
  );

  const detailsFields = (
    <Stack spacing={2}>
      {selectedIntegration?.id && usesIntegration && (
        <Box
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {selectedIntegration.action}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedIntegration.description}
            </Typography>
          </Box>

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
    </Stack>
  );

  const paramsFields = (
    <Stack spacing={2}>
      {usesIntegration && selectedIntegration?.id && onParametersChange ? (
        <NodeInputValues
          properties={selectedIntegration.inputSchema?.properties ?? {}}
          parameters={parameters}
          onChange={onParametersChange}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Select an integration to configure its parameters.
        </Typography>
      )}
    </Stack>
  );

  const submitButton = (
    <Button
      size="large"
      variant="contained"
      fullWidth
      onClick={handleSubmit}
      disabled={
        !newNodeLabel ||
        (newNodeType === "NORMAL" &&
          Object.entries(
            selectedIntegration?.inputSchema?.properties ?? {}
          ).some(([field, schema]) =>
            getInputError({ parameters, field, schema })
          )) ||
        (newNodeType === "HANDOFF" && !handoffTargetAgentId) ||
        (usesIntegration && !selectedIntegration?.id)
      }
    >
      {editMode ? "Save Node" : "Add Node"}
    </Button>
  );

  const onDrawerClose = () => {
    setActiveTab("node");
    handleDrawerClose();
  };

  return (
    <DrawerLayout
      open={drawerOpen}
      onClose={onDrawerClose}
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
            {editMode ? "Save Node" : "Add New Node"}
          </Typography>
        </Box>
      }
    >
      <Box
        data-cy="node-editor-drawer"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Node" value="node" />
          <Tab label="Details" value="details" />
          <Tab label="Params" value="params" />
        </Tabs>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Box sx={{ display: activeTab === "node" ? "block" : "none" }}>
            {nodeFields}
          </Box>
          <Box sx={{ display: activeTab === "details" ? "block" : "none" }}>
            {detailsFields}
          </Box>
          <Box sx={{ display: activeTab === "params" ? "block" : "none" }}>
            {paramsFields}
          </Box>
        </Box>

        <Box
          sx={{
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {submitButton}
        </Box>
      </Box>
    </DrawerLayout>
  );
};

export default NodeEditorDrawer;
