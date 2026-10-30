import { DEFAULT_INTEGRATION } from "./APITab";

export type SchemaNode = {
  id?: string;
  name?: string;
  type: string;
  properties?: SchemaNode[];
};

export type SchemaEditorHandle = { schemaOutput: () => SchemaNode };

export type CustomType = { name: string; schema?: SchemaNode };

export type Param = {
  id: string;
  name?: string;
  type?: string;
  in?: string;
  required?: boolean;
  description?: string;
  [key: string]: unknown;
};

export type Endpoint = {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  params?: Param[];
  request?: { schema?: Partial<SchemaNode> };
  response?: { schema?: Partial<SchemaNode> };
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
