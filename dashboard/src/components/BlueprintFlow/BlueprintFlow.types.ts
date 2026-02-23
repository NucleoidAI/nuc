import { DefinitionGraph } from "./helper";
import type { ValidationError } from "./Validation/validation";

export type SavedNode = DefinitionGraph["nodes"][string]["raw"];

export interface BaselineNodes {
  blueprintId: string;
  nodes: SavedNode[];
}

export interface BlueprintFlowProps {
  graphData: DefinitionGraph;
  enrichedGraphData: DefinitionGraph;
  drawerOpen: boolean;
  hasLocalChanges: boolean;
  hasDifferences: boolean;
  validationErrors: ValidationError[];
  showDiffPanel: boolean;
  showValidationErrors: boolean;
  saveSuccess: boolean;
  baselineNodes: BaselineNodes["nodes"];
  onFlowChange: (graph: DefinitionGraph) => void;
  onAddNodeClick: (node: { id: string }) => void;
  onEditNodeClick: (node: { id: string }) => void;
  onSave: () => void;
  onShowDiff: () => void;
  onCloseDiff: () => void;
  onShowValidationErrors: (value: boolean) => void;
  onSaveSuccessChange: (value: boolean) => void;
  isSuperviseFlow?: boolean;
}
