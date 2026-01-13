type ValidationError = {
  nodeId: string;
  nodeLabel: string;
  nextNodeId: string;
  nextNodeLabel: string;
  missingProperties: string[];
  message: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

type IntegrationSchema = {
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

type Integration = {
  id: string;
  action: string;
  provider: string;
  description: string;
  direction: string;
  lib: string;
  inputSchema: IntegrationSchema;
  outputSchema?: IntegrationSchema;
};

type GraphNode = {
  id: string;
  label?: string;
  action?: string;
  nodeType?: string;
  next?: string | string[];
  trueNext?: string[];
  falseNext?: string[];
};

function validateSchemaCompatibility(
  outputSchema: IntegrationSchema | undefined,
  inputSchema: IntegrationSchema | undefined
): { isCompatible: boolean; missingProperties: string[] } {
  if (!outputSchema?.properties || !inputSchema?.properties) {
    return { isCompatible: true, missingProperties: [] };
  }

  const outputProps = Object.keys(outputSchema.properties);
  const inputProps = Object.keys(inputSchema.properties);

  const missingProperties = inputProps.filter((prop) => {
    const inputProp = inputSchema.properties[prop];
    if (inputProp.nullable) {
      return false;
    }
    return !outputProps.includes(prop);
  });

  return {
    isCompatible: missingProperties.length === 0,
    missingProperties,
  };
}

function validateFlow(
  graphData: { nodes: Record<string, GraphNode>; roots: string[] },
  integrations: Integration[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!graphData?.nodes || !integrations) {
    return { isValid: true, errors: [] };
  }

  const integrationMap = new Map<string, Integration>();
  integrations.forEach((integration) => {
    integrationMap.set(integration.action, integration);
  });

  Object.values(graphData.nodes).forEach((node) => {
    if (!node.action || node.nodeType === "CONDITION") {
      return;
    }

    const currentIntegration = integrationMap.get(node.action);
    if (!currentIntegration) {
      return;
    }

    const nextNodeIds: string[] = [];
    if (node.nodeType === "CONDITION") {
      if (node.trueNext) nextNodeIds.push(...node.trueNext);
      if (node.falseNext) nextNodeIds.push(...node.falseNext);
    } else {
      if (typeof node.next === "string") {
        nextNodeIds.push(node.next);
      } else if (Array.isArray(node.next)) {
        nextNodeIds.push(...node.next);
      }
    }

    nextNodeIds.forEach((nextNodeId) => {
      const nextNode = graphData.nodes[nextNodeId];
      if (!nextNode?.action || nextNode.nodeType === "CONDITION") {
        return;
      }

      const nextIntegration = integrationMap.get(nextNode.action);
      if (!nextIntegration) {
        return;
      }

      const { isCompatible, missingProperties } = validateSchemaCompatibility(
        currentIntegration.outputSchema,
        nextIntegration.inputSchema
      );

      if (!isCompatible) {
        errors.push({
          nodeId: node.id,
          nodeLabel: node.label || node.id,
          nextNodeId: nextNode.id,
          nextNodeLabel: nextNode.label || nextNode.id,
          missingProperties,
          message: `Node "${
            node.label || node.id
          }" output is missing required properties for "${
            nextNode.label || nextNode.id
          }": ${missingProperties.join(", ")}`,
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export { validateFlow };
export type { ValidationError };
