import {
  isBranchNodeType,
  isSwitchNodeType,
} from "../../components/BlueprintFlow/helper";

export const isValidIntegration = (integration) => {
  return (
    typeof integration === "object" &&
    typeof integration.id === "string" &&
    typeof integration.action === "string" &&
    typeof integration.provider === "string" &&
    integration.inputSchema &&
    integration.inputSchema.type === "object" &&
    typeof integration.inputSchema.properties === "object"
  );
};

export const hasMatchingProperties = (parentOutputSchema, childInputSchema) => {
  if (!parentOutputSchema || !childInputSchema) return true;
  if (!parentOutputSchema.properties || !childInputSchema.properties)
    return true;

  const parentOutputProps = Object.keys(parentOutputSchema.properties);
  const childInputProps = Object.keys(childInputSchema.properties);

  return parentOutputProps.some((prop) => childInputProps.includes(prop));
};

export const getNextNodeId = (selectedParentNode, selectedBranch) => {
  if (!selectedParentNode) return null;

  if (isSwitchNodeType(selectedParentNode.nodeType)) return null;

  if (isBranchNodeType(selectedParentNode.nodeType)) {
    if (selectedBranch === "true") {
      return selectedParentNode.trueNext?.[0];
    } else {
      return selectedParentNode.falseNext?.[0];
    }
  } else {
    if (Array.isArray(selectedParentNode.next)) {
      return selectedParentNode.next[0];
    }
    return selectedParentNode.next;
  }
};
