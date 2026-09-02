import { DEFAULT_INTEGRATION } from "./APITab";

export type Endpoint = {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  params?: Array<{
    id?: string;
    in: string;
    type: string;
    required: boolean;
    name?: string;
    description?: string;
  }>;
  request?: { schema?: unknown[] };
  response?: { schema?: unknown[] };
  action?: string;
};

export type NodeEditorState = {
  open: boolean;
  editMode: boolean;
  parentNode: {
    id: string;
    label?: string;
    action?: string;
    nodeType?: string;
    next?: string | string[];
    trueNext?: string[];
    falseNext?: string[];
  } | null;
  editingNodeId: string | null;
  label: string;
  instructions: string;
  pseudocodeEnabled: boolean;
  pseudocode: string;
  pseudocodeLoading: boolean;
  nodeType: string;
  branch: "true" | "false";
  integration: typeof DEFAULT_INTEGRATION;
};
