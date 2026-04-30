import { Box } from "@mui/material";
import Dialog from "./components/Dialog";
import FlowArea from "./components/FlowArea";
import LeftSideApiTree from "./components/LeftSideApiTree";
import NodeEditorWidget from "../NodeEditorWidget/NodeEditorWidget";
import { storage } from "@nucleoidjs/webstorage";
import { v4 as uuidv4 } from "uuid";

import {
  DefinitionGraph,
  buildDefinitionGraph,
} from "../../components/BlueprintFlow/helper";
import { Endpoint, NodeEditorState } from "./types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { publish, useEvent } from "@nucleoidai/react-event";

const ALL_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
type APIDialogOpenEvent = {
  open: boolean;
  type?: "method" | "resource";
  action?: "add" | "edit";
};

export const DEFAULT_INTEGRATION = {
  id: "",
  action: "",
  provider: "",
  description: "",
  icon: "",
  direction: "",
  lib: "",
  inputSchema: { type: "object" as const, properties: {} },
  outputSchema: { type: "object" as const, properties: {} },
};

const INITIAL_NODE_EDITOR: NodeEditorState = {
  open: false,
  editMode: false,
  parentNode: null,
  editingNodeId: null,
  label: "",
  prompt: "",
  nodeType: "NORMAL",
  branch: "true",
  integration: DEFAULT_INTEGRATION,
};

function normalizePath(path: string): string {
  let p = path.trim();
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+/g, "/");
  if (p.length > 1) p = p.replace(/\/$/, "");
  return p;
}

function isSameOrChildPath(path: string, rootPath: string): boolean {
  return path === rootPath || path.startsWith(`${rootPath}/`);
}

function buildInitialFlowGraph(resourcePath: string): DefinitionGraph {
  return buildDefinitionGraph([
    {
      id: "request-starter",
      type: "NORMAL",
      properties: {
        label: "Request",
        icon: "simple-icons:swagger",
        description: `Incoming HTTP request to ${resourcePath}`,
        action: "REQUEST",
      },
      next: ["response-end"],
    },
    {
      id: "response-end",
      type: "NORMAL",
      properties: {
        label: "Response",
        icon: "simple-icons:swagger",
        description: `HTTP response from ${resourcePath}`,
        action: "RESPONSE",
      },
      next: [] as string[],
    },
  ]);
}

function toOpenAPIPaths(endpoints: Endpoint[]) {
  const paths: Record<string, Record<string, object>> = {};

  for (const ep of endpoints) {
    if (!paths[ep.path]) paths[ep.path] = {};
    const method = ep.method.toLowerCase();

    const operation: Record<string, unknown> = {
      summary: ep.summary || `${ep.method} ${ep.path}`,
      description: ep.description || "",
      responses: { "200": { description: "OK" } },
    };

    if (ep.params?.length) {
      operation.parameters = ep.params.map((p) => ({
        name: p.name,
        in: p.in,
        required: p.required,
        schema: { type: p.type },
        description: p.description,
      }));
    }

    if (method !== "get" && ep.request?.schema) {
      operation.requestBody = {
        content: { "application/json": { schema: ep.request.schema } },
      };
    }

    paths[ep.path][method] = operation;
  }

  return paths;
}

function APITab({ agentId }: { agentId: string }) {
  const [api, setApi] = useState<Endpoint[]>([]);

  const [types, setTypes] = useState<
    Array<{ name: string; schema: unknown; isTypeScript?: boolean }>
  >([]);
  const [dialog, setDialog] = useState<{
    type: "method" | "resource" | null;
    action: "add" | "edit" | null;
    open: boolean;
  }>({ type: null, action: null, open: false });
  const [dialogView, setDialogView] = useState("PARAMS");
  const [dialogKey, setDialogKey] = useState(0);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedTreeItem, setSelectedTreeItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    anchor: { clientX: number; clientY: number } | null;
    open: boolean;
  }>({ anchor: null, open: false });
  const [flowGraphs, setFlowGraphs] = useState<Record<string, DefinitionGraph>>(
    {}
  );
  const [nodeEditor, setNodeEditor] =
    useState<NodeEditorState>(INITIAL_NODE_EDITOR);
  const hydratedRef = useRef(false);

  const methodRef = useRef("GET");
  const pathRef = useRef("/");
  const paramsRef = useRef([]);
  const addParams = useRef(null);
  const requestSchemaRef = useRef<{ schemaOutput?: () => unknown }>();
  const responseSchemaRef = useRef<{ schemaOutput?: () => unknown }>();
  const typesRef = useRef({});

  const [selected] = useEvent("SELECTED_API_CHANGED", {
    path: "/",
    method: "GET",
  });
  const [typeAdd] = useEvent("API_TYPE_ADD", null);
  const [typeDelete] = useEvent("API_TYPE_DELETE", null);
  const [typeRename] = useEvent("API_TYPE_RENAME", null);
  const [methodDelete] = useEvent("API_METHOD_DELETE", null);
  const [resourceDelete] = useEvent("API_RESOURCE_DELETE", null);
  const [apiDialogOpen] = useEvent<APIDialogOpenEvent | null>(
    "API_DIALOG_OPEN",
    null
  );

  const isEdit = dialog.type === "method" && dialog.action === "edit";
  const isAddMethod = dialog.type === "method" && dialog.action === "add";
  const activeResourcePath =
    selected?.path && selected.path !== "/" ? selected.path : null;
  const flowGraphData = activeResourcePath
    ? flowGraphs[activeResourcePath] ?? null
    : null;
  const selectedEndpoint = api.find(
    (ep) =>
      ep.path === selected?.path &&
      ep.method?.toLowerCase() === selected?.method?.toLowerCase()
  );
  const basePath = isEdit
    ? selectedEndpoint?.path || selected?.path || "/"
    : selected?.path || "/";
  const usedMethods = api
    .filter((ep) => ep.path === selected?.path)
    .map((ep) => ep.method?.toUpperCase());
  const allowedMethods = isEdit
    ? [selectedEndpoint?.method?.toUpperCase() || "GET"]
    : isAddMethod
    ? ALL_METHODS.filter((m) => !usedMethods.includes(m))
    : ALL_METHODS;
  const dialogTitle = isEdit
    ? "Edit API Endpoint"
    : isAddMethod
    ? "Add Method"
    : "Add Resource";

  useEffect(() => {
    fetch(`http://localhost:3004/swagger/drafts/${agentId}`)
      .then((res) => res.json())
      .then((data) => {
        const draft = data?.draft;
        if (!draft) return;
        if (Array.isArray(draft.api)) setApi(draft.api);
        if (Array.isArray(draft.types)) setTypes(draft.types);
        if (draft.flowGraphs && typeof draft.flowGraphs === "object") {
          setFlowGraphs(draft.flowGraphs);
        }
      })
      .catch(console.error)
      .finally(() => {
        hydratedRef.current = true;
      });
  }, [agentId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    fetch(`http://localhost:3004/swagger/drafts/${agentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api,
        types,
        flowGraphs,
      }),
    }).catch(console.error);
  }, [api, types, flowGraphs, agentId]);

  useEffect(() => {
    if (!typeAdd?.typeName) return;
    setTypes((prev) => {
      if (prev.some((t) => t.name === typeAdd.typeName)) return prev;
      return [
        ...prev,
        {
          name: typeAdd.typeName,
          schema: {
            name: typeAdd.typeName,
            type: "object",
            properties: [
              { type: "string", name: "id" },
              { type: "string", name: "name" },
            ],
          },
        },
      ];
    });
  }, [typeAdd]);

  useEffect(() => {
    if (!typeDelete) return;
    setTypes((prev) => prev.filter((t) => t.name !== typeDelete.typeName));
  }, [typeDelete]);

  useEffect(() => {
    if (!typeRename) return;
    setTypes((prev) =>
      prev.map((t) =>
        t.name === typeRename.oldTypeName
          ? {
              ...t,
              name: typeRename.newTypeName,
              schema: {
                ...(t.schema as object),
                name: typeRename.newTypeName,
              },
            }
          : t
      )
    );
  }, [typeRename]);

  useEffect(() => {
    publish("API_TYPES_CHANGED", { types });
  }, [types]);

  useEffect(() => {
    publish("API_DATA_CHANGED", api);
    const pathIds = new Set<string>();
    api.forEach((ep) => {
      pathIds.add("/");
      if (ep.path !== "/") {
        const parts = ep.path.split("/").filter(Boolean);
        let currentPath = "";
        for (const part of parts) {
          currentPath += "/" + part;
          pathIds.add(currentPath);
        }
      }
    });
    setExpanded(Array.from(pathIds));
  }, [api]);

  useEffect(() => {
    if (!apiDialogOpen || typeof apiDialogOpen.open !== "boolean") return;

    setDialog((prev) => {
      if (!apiDialogOpen.open) {
        return { ...prev, open: false };
      }

      return {
        type: apiDialogOpen.type ?? prev.type,
        action: apiDialogOpen.action ?? prev.action,
        open: true,
      };
    });
  }, [apiDialogOpen]);

  useEffect(() => {
    if (!methodDelete || !selected) return;
    const deletedPath = selected.path;
    const deletedMethod = selected.method?.toLowerCase();
    setApi((prev) => {
      const next = prev.filter(
        (r) =>
          !(r.path === deletedPath && r.method?.toLowerCase() === deletedMethod)
      );
      const hasRemainingUnderPath = next.some((ep) =>
        isSameOrChildPath(ep.path, deletedPath)
      );
      if (!hasRemainingUnderPath) {
        setFlowGraphs((prevGraphs) => {
          const nextGraphs = { ...prevGraphs };
          delete nextGraphs[deletedPath];
          return nextGraphs;
        });
      }
      return next;
    });
  }, [methodDelete, selected]);

  useEffect(() => {
    if (!resourceDelete?.path) return;
    const deletedPath = resourceDelete.path;
    setApi((prev) =>
      prev.filter((ep) => !isSameOrChildPath(ep.path, deletedPath))
    );
    setFlowGraphs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((path) => {
        if (isSameOrChildPath(path, deletedPath)) delete next[path];
      });
      return next;
    });
  }, [resourceDelete]);

  useEffect(() => {
    if (!dialog.open) return;
    setDialogView("PARAMS");
    setDialogKey((k) => k + 1);
    if (isEdit && selectedEndpoint) {
      methodRef.current = selectedEndpoint.method?.toUpperCase() || "GET";
      pathRef.current = normalizePath(selectedEndpoint.path || "/");
      paramsRef.current = [...(selectedEndpoint.params || [])] as never[];
    } else {
      methodRef.current = "GET";
      pathRef.current = normalizePath(selected?.path || "/");
      paramsRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog.open]);

  useEffect(() => {
    if (!activeResourcePath || flowGraphs[activeResourcePath]) return;
    if (
      !api.some(
        (ep) =>
          ep.path === activeResourcePath ||
          ep.path.startsWith(activeResourcePath + "/")
      )
    )
      return;
    setFlowGraphs((prev) => ({
      ...prev,
      [activeResourcePath]: buildInitialFlowGraph(activeResourcePath),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResourcePath, api]);

  useEffect(() => {
    if (api.length === 0) return;
    fetch(`http://localhost:3004/swagger/update-paths`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paths: toOpenAPIPaths(api),
        token: storage.get("link", "accessToken"),
        agentId,
        blueprint: flowGraphs,
      }),
    }).catch(console.error);
  }, [api, flowGraphs, agentId]);

  const handleSave = () => {
    if (isEdit) {
      setApi((prev) => {
        const idx = prev.findIndex(
          (ep) =>
            ep.path === selected.path &&
            ep.method?.toLowerCase() === selected.method?.toLowerCase()
        );
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          request: {
            ...(next[idx].request || {}),
            schema:
              (requestSchemaRef.current?.schemaOutput?.() as unknown[]) || [],
          },
          response: {
            ...(next[idx].response || {}),
            schema:
              (responseSchemaRef.current?.schemaOutput?.() as unknown[]) || [],
          },
          params: paramsRef.current,
        };
        return next;
      });
    } else {
      const path = normalizePath(pathRef.current);
      const method = methodRef.current;
      setApi((prev) => {
        if (
          prev.some(
            (ep) =>
              ep.path === path &&
              ep.method?.toUpperCase() === method?.toUpperCase()
          )
        ) {
          return prev;
        }
        return [
          ...prev,
          {
            path,
            method,
            request:
              (requestSchemaRef.current?.schemaOutput?.() as {
                schema?: unknown[];
              }) || {},
            response:
              (responseSchemaRef.current?.schemaOutput?.() as {
                schema?: unknown[];
              }) || {},
            params: paramsRef.current,
            summary: `${method} ${path}`,
            description: `API endpoint for ${path}`,
          },
        ];
      });
    }
    publish("API_DIALOG_OPEN", { open: false });
  };

  const handleAddNodeClick = useCallback(
    (node: { id: string }) => {
      const graphNode = flowGraphData?.nodes?.[node.id];
      setNodeEditor({
        ...INITIAL_NODE_EDITOR,
        open: true,
        parentNode: graphNode ?? { id: node.id },
      });
    },
    [flowGraphData]
  );

  const handleEditNodeClick = useCallback(
    (node: { id: string }) => {
      if (node.id === "request-starter" || node.id === "response-end") {
        publish("API_DIALOG_OPEN", {
          open: true,
          type: "method",
          action: "edit",
        });
        return;
      }

      const graphNode = flowGraphData?.nodes?.[node.id];
      if (!graphNode) return;

      const parent = flowGraphData?.nodes
        ? Object.values(flowGraphData.nodes).find((n) => {
            if (n.next === graphNode.id) return true;
            if (Array.isArray(n.next) && n.next.includes(graphNode.id))
              return true;
            if (Array.isArray(n.trueNext) && n.trueNext.includes(graphNode.id))
              return true;
            if (
              Array.isArray(n.falseNext) &&
              n.falseNext.includes(graphNode.id)
            )
              return true;
            return false;
          })
        : null;

      setNodeEditor({
        ...INITIAL_NODE_EDITOR,
        open: true,
        editMode: true,
        editingNodeId: graphNode.id,
        label: graphNode.label || "",
        prompt: (graphNode.raw?.properties?.prompt as string) || "",
        nodeType: graphNode.nodeType || "NORMAL",
        parentNode: parent ?? null,
      });
    },
    [flowGraphData]
  );

  const handleFlowChange = useCallback(
    (updatedGraph: DefinitionGraph) => {
      if (!activeResourcePath) return;
      setFlowGraphs((prev) => ({
        ...prev,
        [activeResourcePath]: updatedGraph,
      }));
    },
    [activeResourcePath]
  );

  const handleNodeSubmit = () => {
    if (!activeResourcePath || !flowGraphData) return;

    const { editMode, editingNodeId, label, prompt, nodeType, parentNode } =
      nodeEditor;
    const icon =
      nodeType === "CONDITION"
        ? "mdi:source-branch"
        : nodeEditor.integration?.icon || "mdi:cube-outline";
    const action =
      nodeType === "CONDITION"
        ? "PLATFORM:decision"
        : nodeEditor.integration?.action;
    const description =
      nodeType === "CONDITION"
        ? "A decision node that branches the flow based on conditions."
        : nodeEditor.integration?.description || "";

    const currentNodes = { ...flowGraphData.nodes };

    if (editMode && editingNodeId) {
      const node = currentNodes[editingNodeId];
      if (!node) return;
      currentNodes[editingNodeId] = {
        ...node,
        label,
        description,
        action,
        icon,
        nodeType,
        raw: {
          ...node.raw,
          type: nodeType,
          properties: {
            ...node.raw?.properties,
            label,
            prompt,
            description,
            action,
            icon,
          },
        },
      };
    } else if (parentNode) {
      const newId = uuidv4();
      const parentData = currentNodes[parentNode.id];
      if (!parentData) return;

      const inheritedNext =
        typeof parentData.next === "string"
          ? parentData.next
          : Array.isArray(parentData.next)
          ? parentData.next[0]
          : null;

      currentNodes[newId] = {
        id: newId,
        label,
        description,
        nodeType,
        action,
        icon,
        createdAt: new Date().toISOString(),
        connectorType: "default" as const,
        next: inheritedNext,
        raw: {
          id: newId,
          type: nodeType,
          properties: { action, label, prompt, description, icon },
          next: inheritedNext ? [inheritedNext] : [],
          createdAt: new Date().toISOString(),
        },
      };
      currentNodes[parentNode.id] = {
        ...parentData,
        next: newId,
        raw: { ...parentData.raw, next: [newId] },
      };
    }

    const referenced = new Set<string>();
    Object.values(currentNodes).forEach((n) => {
      if (typeof n.next === "string") referenced.add(n.next);
      else if (Array.isArray(n.next))
        n.next.forEach((id) => referenced.add(id));
      if (Array.isArray(n.trueNext))
        n.trueNext.forEach((id) => referenced.add(id));
      if (Array.isArray(n.falseNext))
        n.falseNext.forEach((id) => referenced.add(id));
    });
    const roots = Object.keys(currentNodes).filter((id) => !referenced.has(id));

    setFlowGraphs((prev) => ({
      ...prev,
      [activeResourcePath]: { nodes: currentNodes, roots },
    }));
    setNodeEditor(INITIAL_NODE_EDITOR);
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}
    >
      <Box sx={{ display: "flex", gap: 2, flex: 1, minHeight: 0 }}>
        <LeftSideApiTree
          api={api}
          expanded={expanded}
          setExpanded={setExpanded}
          selected={selected}
          selectedTreeItem={selectedTreeItem}
          setSelectedTreeItem={setSelectedTreeItem}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
        />

        <FlowArea
          api={api}
          flowGraphData={flowGraphData}
          handleAddNodeClick={handleAddNodeClick}
          handleEditNodeClick={handleEditNodeClick}
          handleFlowChange={handleFlowChange}
          nodeEditor={nodeEditor}
          activeResourcePath={activeResourcePath}
        />
      </Box>

      <Dialog
        dialog={dialog}
        dialogTitle={dialogTitle}
        dialogView={dialogView}
        setDialogView={setDialogView}
        handleSave={handleSave}
        selected={selected}
        isEdit={isEdit}
        isAddMethod={isAddMethod}
        basePath={basePath}
        methodRef={methodRef}
        pathRef={pathRef}
        paramsRef={paramsRef}
        requestSchemaRef={requestSchemaRef}
        responseSchemaRef={responseSchemaRef}
        typesRef={typesRef}
        types={types}
        selectedEndpoint={selectedEndpoint}
        dialogKey={dialogKey}
        allowedMethods={allowedMethods}
        addParams={addParams}
      />

      <NodeEditorWidget
        pseudocode=""
        drawerOpen={nodeEditor.open}
        handleDrawerClose={() => setNodeEditor(INITIAL_NODE_EDITOR)}
        selectedParentNode={nodeEditor.parentNode}
        graphData={flowGraphData}
        newNodeLabel={nodeEditor.label}
        setNewNodeLabel={(v: string) =>
          setNodeEditor((p) => ({ ...p, label: v }))
        }
        newNodePrompt={nodeEditor.prompt}
        setNewNodePrompt={(v: string) =>
          setNodeEditor((p) => ({ ...p, prompt: v }))
        }
        newNodeType={nodeEditor.nodeType}
        setNewNodeType={(v: string) =>
          setNodeEditor((p) => ({ ...p, nodeType: v }))
        }
        selectedBranch={nodeEditor.branch}
        setSelectedBranch={(v: "true" | "false") =>
          setNodeEditor((p) => ({ ...p, branch: v }))
        }
        handleSubmit={handleNodeSubmit}
        selectedIntegration={nodeEditor.integration}
        setSelectedIntegration={(v: typeof DEFAULT_INTEGRATION) =>
          setNodeEditor((p) => ({ ...p, integration: v }))
        }
        editMode={nodeEditor.editMode}
        editingNode={
          nodeEditor.editingNodeId &&
          flowGraphData?.nodes?.[nodeEditor.editingNodeId]
            ? flowGraphData.nodes[nodeEditor.editingNodeId]
            : undefined
        }
        agentId={agentId}
      />
    </Box>
  );
}

export default APITab;
