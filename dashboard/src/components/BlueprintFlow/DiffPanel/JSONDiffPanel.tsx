import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ReactDiffViewer from "react-diff-viewer-continued";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { DefinitionGraph, FlowDefinition } from "../helper";
import React, { useMemo } from "react";
import {
  calculateDiffStats,
  extractNodesFromFlow,
  normalizeJSON,
} from "./diffHelper";

type NodeType = {
  id: string;
  type: string;
  properties?: {
    label?: string;
    icon?: string;
    action?: string;
    description?: string;
    [key: string]: unknown;
  };
  next?: string[] | null;
  true?: string[] | null;
  false?: string[] | null;
  createdAt?: string;
};

interface JSONDiffPanelProps {
  savedNodes: NodeType[];
  aiGeneratedFlow: FlowDefinition | DefinitionGraph | null;
  currentGraphData?: DefinitionGraph | null;
  open: boolean;
  onClose: () => void;
}

const JSONDiffPanel: React.FC<JSONDiffPanelProps> = ({
  savedNodes,
  aiGeneratedFlow,
  currentGraphData,
  open,
  onClose,
}) => {
  const theme = useTheme();

  const isAIGenerated = Boolean(aiGeneratedFlow && !currentGraphData);

  const { savedJSON, currentJSON, stats } = useMemo(() => {
    const savedNodesArray = savedNodes || [];

    let currentNodesArray = [];

    if (currentGraphData?.nodes) {
      currentNodesArray = Object.values(currentGraphData.nodes).map(
        (node) => node.raw || node
      );
    } else if (aiGeneratedFlow) {
      if (
        typeof aiGeneratedFlow === "object" &&
        "nodes" in aiGeneratedFlow &&
        aiGeneratedFlow.nodes &&
        !Array.isArray(aiGeneratedFlow.nodes) &&
        "roots" in aiGeneratedFlow
      ) {
        const graphFlow = aiGeneratedFlow as DefinitionGraph;
        currentNodesArray = Object.values(graphFlow.nodes).map(
          (node) => node.raw || node
        );
      } else {
        const flowDefinition = aiGeneratedFlow as FlowDefinition;
        currentNodesArray = extractNodesFromFlow(flowDefinition);
      }
    }

    const savedJSON = normalizeJSON(savedNodesArray);
    const currentJSON = normalizeJSON(currentNodesArray);
    const stats = calculateDiffStats(savedNodesArray, currentNodesArray);

    return { savedJSON, currentJSON, stats };
  }, [savedNodes, aiGeneratedFlow, currentGraphData]);

  const customStyles = {
    variables: {
      light: {
        diffViewerBackground: "#fafafa",
        diffViewerColor: theme.palette.text.primary,
        addedBackground: "#e6ffed",
        addedColor: "#24292e",
        removedBackground: "#ffeef0",
        removedColor: "#24292e",
        wordAddedBackground: "#acf2bd",
        wordRemovedBackground: "#fdb8c0",
        addedGutterBackground: "#cdffd8",
        removedGutterBackground: "#ffdce0",
        gutterBackground: "#f0f0f0",
        gutterBackgroundDark: "#e8e8e8",
        highlightBackground: "#fffbdd",
        highlightGutterBackground: "#fff5b1",
        codeFoldGutterBackground: "#dbedff",
        codeFoldBackground: "#f1f8ff",
        emptyLineBackground: "#fafbfc",
        gutterColor: "#6a737d",
        addedGutterColor: "#28a745",
        removedGutterColor: "#d73a49",
        codeFoldContentColor: "#0366d6",
        diffViewerTitleBackground: "#f6f8fa",
        diffViewerTitleColor: "#24292e",
        diffViewerTitleBorderColor: "#e1e4e8",
      },
      dark: {
        diffViewerBackground: "#1e1e1e",
        diffViewerColor: theme.palette.text.primary,
        addedBackground: "#1a4d1a",
        addedColor: "#e6ffed",
        removedBackground: "#4d1a1a",
        removedColor: "#ffeef0",
        wordAddedBackground: "#2ea44f",
        wordRemovedBackground: "#f85149",
        addedGutterBackground: "#164b2e",
        removedGutterBackground: "#6e1f1f",
        gutterBackground: "#252525",
        gutterBackgroundDark: "#1a1a1a",
        highlightBackground: "#3d3d1a",
        highlightGutterBackground: "#4d4d1a",
        codeFoldGutterBackground: "#1e4273",
        codeFoldBackground: "#1c2938",
        emptyLineBackground: "#2d2d2d",
        gutterColor: "#8b949e",
        addedGutterColor: "#3fb950",
        removedGutterColor: "#f85149",
        codeFoldContentColor: "#58a6ff",
        diffViewerTitleBackground: "#161b22",
        diffViewerTitleColor: "#c9d1d9",
        diffViewerTitleBorderColor: "#21262d",
      },
    },
    line: {
      padding: "8px 4px",
      "&:hover": {
        background: theme.palette.action.hover,
      },
    },
    gutter: {
      padding: "8px 12px",
      minWidth: "50px",
      textAlign: "right",
      userSelect: "none",
    },
    marker: {
      padding: "8px 4px",
      width: "25px",
    },
    wordDiff: {
      padding: "2px 4px",
      borderRadius: "2px",
    },
    contentText: {
      wordBreak: "break-word",
    },
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      container={() => document.body}
      sx={{
        zIndex: 9999,
        "& .MuiBackdrop-root": {
          zIndex: 9998,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
      ModalProps={{
        keepMounted: false,
        disablePortal: false,
      }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "95%", sm: "80%", md: "70%", lg: "60%" },
            maxWidth: "1000px",
            backgroundColor: theme.palette.background.default,
            zIndex: 9999,
            backgroundImage:
              theme.palette.mode === "dark"
                ? "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))"
                : "none",
          },
        },
      }}
    >
      <Box
        data-cy="json-diff-panel"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)"
                : "linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {isAIGenerated ? "🤖 AI Generated Changes" : "✏️ Manual Changes"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isAIGenerated
                ? "Review AI-generated flow modifications"
                : "Compare saved flow with your edits"}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="large"
            sx={{
              backgroundColor: theme.palette.action.hover,
              "&:hover": {
                backgroundColor: theme.palette.action.selected,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            p: 2.5,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
            Changes:
          </Typography>
          {stats.added > 0 && (
            <Chip
              icon={<AddCircleOutlineIcon />}
              label={`${stats.added} Added`}
              color="success"
              size="medium"
              sx={{
                fontWeight: 600,
                "& .MuiChip-icon": {
                  fontSize: "1.2rem",
                },
              }}
            />
          )}
          {stats.modified > 0 && (
            <Chip
              icon={<EditIcon />}
              label={`${stats.modified} Modified`}
              color="warning"
              size="medium"
              sx={{
                fontWeight: 600,
                "& .MuiChip-icon": {
                  fontSize: "1.2rem",
                },
              }}
            />
          )}
          {stats.removed > 0 && (
            <Chip
              icon={<RemoveCircleOutlineIcon />}
              label={`${stats.removed} Removed`}
              color="error"
              size="medium"
              sx={{
                fontWeight: 600,
                "& .MuiChip-icon": {
                  fontSize: "1.2rem",
                },
              }}
            />
          )}
          {stats.total === 0 && (
            <Chip
              label="No Changes Detected"
              size="medium"
              sx={{
                fontWeight: 600,
                backgroundColor: theme.palette.action.selected,
                color: theme.palette.text.primary,
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: theme.palette.background.default,
            "& pre": {
              margin: 0,
              fontSize: "0.875rem",
              fontFamily:
                '"Fira Code", "Monaco", "Consolas", "Courier New", monospace',
              lineHeight: 1.6,
            },
            "& table": {
              fontSize: "0.875rem",
              borderCollapse: "separate",
              borderSpacing: 0,
            },
            "& td": {
              padding: "4px 8px",
            },
            "&::-webkit-scrollbar": {
              width: "12px",
              height: "12px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: theme.palette.background.paper,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.action.hover,
              borderRadius: "6px",
              border: `2px solid ${theme.palette.background.paper}`,
              "&:hover": {
                backgroundColor: theme.palette.action.selected,
              },
            },
          }}
        >
          <ReactDiffViewer
            oldValue={savedJSON}
            newValue={currentJSON}
            splitView={true}
            showDiffOnly={true}
            hideLineNumbers={false}
            useDarkTheme={theme.palette.mode === "dark"}
            leftTitle={`📁 Saved Version (${savedNodes.length} nodes)`}
            rightTitle={
              isAIGenerated
                ? `🤖 AI Generated (${
                    stats.added +
                    stats.modified +
                    (savedNodes.length - stats.removed)
                  } nodes)`
                : `✨ Your Changes (${
                    stats.added +
                    stats.modified +
                    (savedNodes.length - stats.removed)
                  } nodes)`
            }
            styles={customStyles}
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default JSONDiffPanel;
