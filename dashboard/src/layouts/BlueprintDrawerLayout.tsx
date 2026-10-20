import AddIcon from "@mui/icons-material/Add";
import BlueprintChatTitle from "../components/BlueprintChat/BlueprintChatTitle";
import type { BlueprintContext as BlueprintContextData } from "../hooks/useBlueprint";
import BlueprintFlowWidget from "../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import BlueprintKnowledge from "../components/BlueprintKnowledge/BlueprintKnowledge";
import BlueprintSkill from "../components/BlueprintSkill/BlueprintSkill";
import CloseIcon from "@mui/icons-material/Close";
import { DrawerLayout } from "@canmingir/link/layouts";
import { FlowDefinition } from "../components/BlueprintFlow/helper";
import HorizontalSplitIcon from "@mui/icons-material/HorizontalSplit";
import { LowCodeEditor } from "@canmingir/link/platform/components";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SettingsDialog from "../components/SettingsDialog/SettingsDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import SupervisingChat from "../components/SupervisingChat";
import useBlueprint from "../hooks/useBlueprint";
import useSupervisings from "../hooks/useSupervisings";
import {
  Box,
  Dialog,
  DialogContent,
  Fab,
  Grid,
  IconButton,
  List,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { publish, useEvent } from "@nucleoidai/react-event";
import { storage, useStorage } from "@nucleoidjs/webstorage";

type LogicRule = {
  id: string;
  name: string;
  description: string;
  code: string;
};

const defaultLogicRules: LogicRule[] = [
  {
    id: "rule-1",
    name: "Order Type Definition",
    description:
      "Defines the Order type that every order in the flow is built from. Its status is tracked as a string so the order's current stage is always known, and its items are tracked as a list so any number of line items can be attached, from a single item up to the full order.",
    code: `def create_order(status: str, items: list):
    order = Order()
    order.status = status
    order.items = items

    return order`,
  },
  {
    id: "rule-2",
    name: "Item Type Definition",
    description:
      "Defines the Item type that each line item in an order is built from. Its name is tracked as a string for identification, its price as a number per unit, and its quantity as a number of units ordered — all three are required for the item to be priced and counted correctly later in the flow.",
    code: `def create_item(name: str, price: int, quantity: int):
    item = Item()
    item.name = name
    item.price = price
    item.quantity = quantity

    return item`,
  },
  {
    id: "rule-3",
    name: "Item Total Calculation",
    description:
      "Computes the total cost of a single line item, used as the building block for the order's subtotal. The total is always the item's price multiplied by its quantity, and is recalculated whenever either value changes.",
    code: `def calculate_item_total(item: object):
    item.total = item.price * item.quantity

    return item.total`,
  },
  {
    id: "rule-4",
    name: "Invalid Item Price Validation",
    description:
      'Guards against items entering the flow with a negative price, which would otherwise corrupt every downstream total. Whenever an item\'s price is less than 0, the flow refuses to continue and throws "INVALID_PRICE".',
    code: `def validate_item_price(item: object):
    if item.price < 0:
        throw "INVALID_PRICE"

    return item`,
  },
  {
    id: "rule-5",
    name: "Invalid Item Quantity Validation",
    description:
      'Guards against items entering the flow with a quantity that makes no sense to order. Whenever an item\'s quantity is less than or equal to 0, the flow refuses to continue and throws "INVALID_QUANTITY".',
    code: `def validate_item_quantity(item: object):
    if item.quantity <= 0:
        throw "INVALID_QUANTITY"

    return item`,
  },
  {
    id: "rule-6",
    name: "Order Subtotal Calculation",
    description:
      "Computes the order's subtotal before tax and discount are applied. The subtotal is the sum of every line item's total, so it is only accurate once each item's own total has already been calculated.",
    code: `def calculate_order_subtotal(order: object):
    order.subtotal = order.items.reduce(
        (total, item) => total + item.total,
        0
    )

    return order.subtotal`,
  },
  {
    id: "rule-7",
    name: "Order Tax Calculation",
    description:
      "Computes the tax owed on an order, applied as a flat 8% of its subtotal. The subtotal must already be calculated for this value to be correct.",
    code: `def calculate_order_tax(order: object):
    order.tax = order.subtotal * 0.08

    return order.tax`,
  },
  {
    id: "rule-8",
    name: "Order Discount Default",
    description:
      "Sets the starting point for every order's discount before any bulk-order rules run. The discount defaults to 0, so an order only ends up with a discount if a later rule explicitly grants one.",
    code: `def reset_order_discount(order: object):
    order.discount = 0

    return order.discount`,
  },
  {
    id: "rule-9",
    name: "Bulk Order Discount",
    description:
      "Rewards large orders with a bulk discount. Whenever an order's subtotal is greater than or equal to 1000, its discount is set to 10% of that subtotal, overriding the default of 0.",
    code: `def apply_bulk_discount(order: object):
    if order.subtotal >= 1000:
        order.discount = order.subtotal * 0.10

    return order.discount`,
  },
  {
    id: "rule-10",
    name: "No Discount Below Threshold",
    description:
      "Makes explicit that orders below the bulk threshold get no discount. Whenever an order's subtotal is less than 1000, its discount is set to 0, so the bulk discount rule never leaves a stale value in place when an order falls under the limit.",
    code: `def clear_order_discount(order: object):
    if order.subtotal < 1000:
        order.discount = 0

    return order.discount`,
  },
  {
    id: "rule-11",
    name: "Order Total Calculation",
    description:
      "Computes the final amount owed for an order. The total is the subtotal plus tax minus discount, and depends on all three of those values already being calculated.",
    code: `def calculate_order_total(order: object):
    order.total = order.subtotal + order.tax - order.discount

    return order.total`,
  },
  {
    id: "rule-12",
    name: "Order Item Count Calculation",
    description:
      "Computes how many units are in an order in total, used later to flag orders that exceed the item limit. The item count is the sum of the quantities of every item on the order, not the number of distinct line items.",
    code: `def calculate_order_item_count(order: object):
    order.item_count = order.items.reduce(
        (count, item) => count + item.quantity,
        0
    )

    return order.item_count`,
  },
  {
    id: "rule-13",
    name: "Order Audit Flag",
    description:
      "Flags high-value orders for manual review. Whenever an order's total is greater than 1000, the order is marked as requiring an audit; otherwise it is explicitly marked as not requiring one, so the flag always reflects the order's current total rather than a leftover value.",
    code: `def flag_order_for_audit(order: object):
    if order.total > 1000:
        order.audited = true
    else:
        order.audited = false

    return order.audited`,
  },
  {
    id: "rule-14",
    name: "Invalid Order Total Validation",
    description:
      'Catches orders that have ended up with a negative total, which should never happen but would otherwise pass through undetected. Whenever an order\'s total is less than 0, the flow refuses to continue and throws "INVALID_ORDER_TOTAL".',
    code: `def validate_order_total(order: object):
    if order.total < 0:
        throw "INVALID_ORDER_TOTAL"

    return order`,
  },
  {
    id: "rule-15",
    name: "Order Item Limit Validation",
    description:
      'Enforces a cap on how many units a single order can contain. Whenever an order\'s item count is greater than 100, the flow refuses to continue and throws "ORDER_LIMIT_EXCEEDED", and depends on the item count already being calculated.',
    code: `def validate_order_item_limit(order: object):
    if order.item_count > 100:
        throw "ORDER_LIMIT_EXCEEDED"

    return order`,
  },
  {
    id: "rule-16",
    name: "Cannot Ship Empty Order Validation",
    description:
      'Prevents an order from being marked as shipped when it has nothing in it. Whenever an order\'s status is "SHIPPED" and its item count is 0, the flow refuses to continue and throws "CANNOT_SHIP_EMPTY_ORDER".',
    code: `def validate_shippable_order(order: object):
    if order.status == "SHIPPED" and order.item_count == 0:
        throw "CANNOT_SHIP_EMPTY_ORDER"

    return order`,
  },
];

const BlueprintDrawerLayout = ({
  drawerOpen,
  handleDrawerClose,
  selectedItem,
  setAiResponse,
  aiResponse,
  setSelectedItem,
  taskId,
  agentId,
  usedNodeIds,
  lastUsedNodeId,
  failedNodeId,
  teamId,
  supervise,
}: {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
  selectedItem: {
    id: string;
    title: string;
    description: string;
    agentId: string;
    skill?: string;
    executionMode?: "NORMAL" | "LITE";
    api?: boolean;
    context?: BlueprintContextData | null;
  };
  handleAiResponse?: (response: {
    flow: FlowDefinition;
    response?: string;
  }) => void;
  aiResponse?: { flow: FlowDefinition; response?: string };
  setAiResponse?: (response: {
    flow: FlowDefinition;
    response?: string;
  }) => void;
  setSelectedItem?: (item: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  }) => void;
  taskId?: string;
  agentId?: string;
  usedNodeIds?: Set<string>;
  lastUsedNodeId?: string | null;
  failedNodeId?: string | null;
  teamId?: string;
  supervise?: {
    id: string;
    question?: string;
    answer?: string;
    status: string;
    blueprintId?: string;
    taskId?: string;
    conversationId?: string;
    sessionId?: string;
  };
}) => {
  const [title, setTitle] = useState(selectedItem?.title);
  const [description, setDescription] = useState(selectedItem?.description);
  const [skill, setSkill] = useState(selectedItem?.skill);
  const [skillLoading, setSkillLoading] = useState(false);
  const [context, setContext] = useState<BlueprintContextData | null>(
    selectedItem?.context ?? null
  );
  const [liveNodes, setLiveNodes] = useState([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [blocking, setBlocking] = useState<boolean>(true);
  const [liteMode, setLiteMode] = useState<boolean>(
    selectedItem?.executionMode === "LITE"
  );
  const [api, setApi] = useState<boolean>(Boolean(selectedItem?.api));
  const [showConnections] = useStorage(
    "greycollar",
    "blueprintdrawerlayout",
    "showconnections",
    false
  );
  const [superviseChatOpen, setSuperviseChatOpen] = useState<boolean>(
    !!supervise
  );
  const [editBlueprintOpen, setEditBlueprintOpen] = useState(false);

  const [logicEditorOpen, setLogicEditorOpen] = useState(false);
  const [logicRules, setLogicRules] = useState<LogicRule[]>(defaultLogicRules);
  const [selectedLogicRuleId, setSelectedLogicRuleId] = useState(
    defaultLogicRules[0].id
  );
  const selectedLogicRule =
    logicRules.find((rule) => rule.id === selectedLogicRuleId) ?? logicRules[0];

  const handleLogicCodeChange = (value: string) => {
    setLogicRules((prev) =>
      prev.map((rule) =>
        rule.id === selectedLogicRuleId ? { ...rule, code: value } : rule
      )
    );
  };

  const setShowConnections = (value: boolean) => {
    storage.set(
      "greycollar",
      "blueprintdrawerlayout",
      "showconnections",
      value
    );
  };

  const [reopenRequest] = useEvent<{ requestedAt: number | null }>(
    "SUPERVISOR_CHAT_REOPEN",
    { requestedAt: null }
  );

  const [highlightRequest] = useEvent<{ nodeId: string | null }>(
    "BLUEPRINT_HIGHLIGHT_NODE",
    { nodeId: null }
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightRequest?.nodeId) {
      setSelectedNodeId(highlightRequest.nodeId);
    }
  }, [highlightRequest]);

  useEffect(() => {
    publish("BLUEPRINT_CONTEXT", { context: drawerOpen ? context : null });
  }, [drawerOpen, context]);

  useEffect(() => {
    return () => {
      publish("BLUEPRINT_CONTEXT", { context: null });
      publish("SUPERVISOR_CHAT", { canReopen: false });
    };
  }, []);

  useEffect(() => {
    publish("SUPERVISOR_CHAT", {
      canReopen: drawerOpen && !!supervise && !superviseChatOpen,
    });
  }, [drawerOpen, supervise, superviseChatOpen]);

  useEffect(() => {
    if (reopenRequest?.requestedAt && supervise) {
      setSuperviseChatOpen(true);
    }
  }, [reopenRequest, supervise]);

  const { patchBlueprint } = useBlueprint();
  const { approveBlueprintChat } = useSupervisings();

  const handleManualResolve = async (decision: "BLUEPRINT" | "KNOWLEDGE") => {
    if (!supervise?.id) return;
    await approveBlueprintChat({
      supervisingId: supervise.id,
      decision,
      answer:
        decision === "BLUEPRINT"
          ? "Blueprint manually updated"
          : "Knowledge manually added",
    });
  };

  const handleBlockingChange = async (value: boolean) => {
    setBlocking(value);
    if (selectedItem?.id) {
      await patchBlueprint(selectedItem.id, { blocking: value });
    }
  };

  const handleLiteModeChange = async (value: boolean) => {
    setLiteMode(value);
    if (selectedItem?.id) {
      await patchBlueprint(selectedItem.id, {
        executionMode: value ? "LITE" : "NORMAL",
      });
    }
  };

  useEffect(() => {
    setTitle(selectedItem?.title);
    setDescription(selectedItem?.description);
    setSkill(selectedItem?.skill);
    setContext(selectedItem?.context ?? null);
    setSelectedNodeId(null);
  }, [selectedItem]);

  useEffect(() => {
    setLiteMode(selectedItem?.executionMode === "LITE");
    setApi(Boolean(selectedItem?.api));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  useEffect(() => {
    if (supervise) setSuperviseChatOpen(true);
  }, [supervise]);

  const flowContent = (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <BlueprintFlowWidget
        blueprint={{
          ...selectedItem,
          title,
          description,
          agentId: selectedItem?.agentId || agentId,
        }}
        aiResponse={aiResponse}
        setAiResponse={setAiResponse}
        taskId={taskId}
        setSelectedItem={setSelectedItem}
        usedNodeIds={usedNodeIds}
        lastUsedNodeId={lastUsedNodeId}
        failedNodeId={failedNodeId}
        selectedNodeId={selectedNodeId}
        agentId={agentId}
        teamId={teamId}
        blocking={blocking}
        onBlockingChange={handleBlockingChange}
        liteMode={liteMode}
        api={api}
        showConnections={showConnections}
        onSkillChange={setSkill}
        onSkillLoadingChange={setSkillLoading}
        onNodesChange={setLiveNodes}
        onContextChange={setContext}
        onSave={supervise ? () => handleManualResolve("BLUEPRINT") : undefined}
      />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 12, md: 16 },
          left: { xs: 8, sm: 12, md: 16 },
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          maxWidth: { xs: "calc(100% - 80px)", sm: "50%", md: "45%" },
          maxHeight: "calc(100% - 32px)",
        }}
      >
        <BlueprintChatTitle title={title} setTitle={setTitle} />

        <BlueprintSkill
          skill={skill}
          skillLoading={skillLoading}
          showKnowledge={showKnowledge}
          blueprintId={selectedItem?.id}
          nodes={liveNodes}
        />

        {showKnowledge && (
          <BlueprintKnowledge
            setShowKnowledge={setShowKnowledge}
            selectedItem={selectedItem}
            agentId={agentId}
            teamId={teamId}
            onItemAdded={
              supervise ? () => handleManualResolve("KNOWLEDGE") : undefined
            }
          />
        )}
      </Box>

      <Tooltip title="Add Logic" placement="left">
        <Fab
          color="primary"
          onClick={() => setLogicEditorOpen((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 216,
            zIndex: 10,
          }}
        >
          <PsychologyIcon />
        </Fab>
      </Tooltip>

      <Tooltip
        title={showKnowledge ? "Collapse Knowledge" : "Expand Knowledge"}
        placement="left"
      >
        <Fab
          color="primary"
          onClick={() => setShowKnowledge((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 72,
            zIndex: 10,
          }}
        >
          <StickyNote2Icon />
        </Fab>
      </Tooltip>

      <Tooltip title="Edit Blueprint" placement="left">
        <Fab
          color="primary"
          onClick={() => setEditBlueprintOpen((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 168,
            zIndex: 10,
          }}
        >
          <SvgIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <path
                fill="white"
                d="M7.398 12.809a1.042 1.042 0 0 0 1.204-.003c.178-.13.313-.31.387-.518l.447-1.373a2.336 2.336 0 0 1 1.477-1.479l1.391-.45a1.045 1.045 0 0 0-.044-1.98l-1.375-.448a2.335 2.335 0 0 1-1.48-1.477l-.452-1.388a1.044 1.044 0 0 0-1.973.017l-.457 1.4a2.336 2.336 0 0 1-1.44 1.45l-1.39.447a1.045 1.045 0 0 0 .016 1.974l1.374.445a2.333 2.333 0 0 1 1.481 1.488l.452 1.391c.072.204.206.38.382.504m6.137 4.042a.806.806 0 0 0 1.226-.398l.248-.762a1.09 1.09 0 0 1 .26-.42c.118-.12.262-.208.42-.26l.772-.252a.8.8 0 0 0-.023-1.52l-.764-.25a1.075 1.075 0 0 1-.68-.678l-.252-.773a.8.8 0 0 0-1.518.01l-.247.762a1.068 1.068 0 0 1-.665.679l-.773.252a.8.8 0 0 0 .008 1.518l.763.247c.16.054.304.143.422.261c.119.119.207.263.258.422l.253.774a.8.8 0 0 0 .292.388"
              />
            </svg>
          </SvgIcon>
        </Fab>
      </Tooltip>

      <Tooltip
        title={
          showConnections
            ? "Hide parameter connections"
            : "Show parameter connections"
        }
        placement="left"
      >
        <Fab
          color="primary"
          onClick={() => setShowConnections(!showConnections)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 120,
            zIndex: 10,
          }}
        >
          <HorizontalSplitIcon />
        </Fab>
      </Tooltip>

      <Tooltip title="Settings" placement="left">
        <Fab
          color="primary"
          onClick={() => setShowSettings((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 10,
          }}
        >
          <SettingsIcon />
        </Fab>
      </Tooltip>

      <SettingsDialog
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        blocking={blocking}
        setBlocking={handleBlockingChange}
        liteMode={liteMode}
        setLiteMode={handleLiteModeChange}
        api={api}
        setApi={setApi}
        blueprintId={selectedItem?.id}
      />
    </Box>
  );

  return (
    <DrawerLayout
      open={drawerOpen}
      onClose={handleDrawerClose}
      mode="fullscreen"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
      }}
      contentSx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        role="presentation"
      >
        <Grid container sx={{ flex: 1, height: "100%" }} spacing={0}>
          <Grid
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxHeight: "100vh",
              position: "relative",
            }}
            size={{
              xs: 12,
            }}
          >
            {flowContent}
          </Grid>
        </Grid>

        {supervise && (
          <SupervisingChat
            open={superviseChatOpen}
            handleClose={() => setSuperviseChatOpen(false)}
            supervise={supervise}
            agentId={agentId}
          />
        )}

        {editBlueprintOpen && (
          <SupervisingChat
            open={editBlueprintOpen}
            handleClose={() => setEditBlueprintOpen(false)}
            title="Edit Blueprint"
            agentId={agentId || selectedItem?.agentId}
            blueprintId={selectedItem?.id}
          />
        )}

        {logicEditorOpen && (
          <Dialog
            type="medium"
            sx={{
              zIndex: (theme) => theme.zIndex.modal + 2,
            }}
            open={logicEditorOpen}
            onClose={() => setLogicEditorOpen(false)}
          >
            <DialogContent
              sx={{ p: 0, display: "flex", flex: 1, minHeight: 0 }}
            >
              <Box
                sx={{
                  width: 350,
                  display: "flex",
                  flexDirection: "column",
                  borderRight: 1,
                  borderColor: "divider",
                  borderRadius: "4px 0 0 4px",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                  minHeight: 0,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ width: 28 }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ textAlign: "center", flex: 1 }}
                  >
                    Logic
                  </Typography>
                  <Tooltip title="New session">
                    <IconButton size="small">
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <List sx={{ flex: 1, minHeight: 0, overflowY: "auto" }} dense>
                  {logicRules.map((rule) => (
                    <Box
                      onClick={() => setSelectedLogicRuleId(rule.id)}
                      key={rule.id}
                      sx={{
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        cursor: "default",
                        m: 0.5,
                        p: 1,
                        background: (theme) =>
                          rule.id === selectedLogicRuleId
                            ? theme.palette.action.selected
                            : theme.palette.action.hover,
                      }}
                    >
                      <Typography
                        sx={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                        }}
                        variant="body2"
                      >
                        {rule.name}
                      </Typography>
                    </Box>
                  ))}
                </List>
              </Box>

              <Box
                sx={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  minHeight: 0,
                  bgcolor: "#000000",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setLogicEditorOpen(false)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 16,
                    zIndex: 1,
                    color: "common.white",
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                <LowCodeEditor
                  value={selectedLogicRule?.code ?? ""}
                  onChange={handleLogicCodeChange}
                  language="python"
                  editorHeight="100%"
                  showRunButton={false}
                  panelTitle="LOGIC.md"
                  panelContent={selectedLogicRule?.description}
                  showPanel
                />
              </Box>
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </DrawerLayout>
  );
};

export default BlueprintDrawerLayout;
