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

function buildPropertyMap(integrations: Integration[]): Set<string> {
  const allOutputProperties = new Set<string>();

  integrations.forEach((integration) => {
    if (integration.outputSchema?.properties) {
      Object.keys(integration.outputSchema.properties).forEach((prop) => {
        allOutputProperties.add(prop);
      });
    }
  });

  return allOutputProperties;
}

function validateSchemaCompatibility(
  outputSchema: IntegrationSchema | undefined,
  inputSchema: IntegrationSchema | undefined,
  allAvailableProperties: Set<string>
): {
  isCompatible: boolean;
  missingProperties: string[];
  matchingProperties: string[];
  contextuallyAvailable: string[];
} {
  if (!inputSchema?.properties) {
    return {
      isCompatible: true,
      missingProperties: [],
      matchingProperties: [],
      contextuallyAvailable: [],
    };
  }

  const outputProps = outputSchema?.properties
    ? Object.keys(outputSchema.properties)
    : [];
  const inputProps = Object.keys(inputSchema.properties);

  const matchingProperties = inputProps.filter((prop) =>
    outputProps.includes(prop)
  );

  const missingProperties = inputProps.filter((prop) => {
    const inputProp = inputSchema.properties![prop];
    if (inputProp.nullable) {
      return false;
    }
    return !outputProps.includes(prop);
  });

  const contextuallyAvailable = missingProperties.filter((prop) =>
    allAvailableProperties.has(prop)
  );

  const hasAtLeastOneMatch =
    matchingProperties.length > 0 || contextuallyAvailable.length > 0;

  return {
    isCompatible: missingProperties.length === 0 || hasAtLeastOneMatch,
    missingProperties,
    matchingProperties,
    contextuallyAvailable,
  };
}

function validateFlow(
  graphData: { nodes: Record<string, GraphNode>; roots: string[] },
  integrations: Integration[],
  allOutputProperties?: Set<string>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!graphData?.nodes || !integrations) {
    return { isValid: true, errors: [] };
  }
  const propertyMap = allOutputProperties ?? buildPropertyMap(integrations);

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
        nextIntegration.inputSchema,
        propertyMap
      );

      if (!isCompatible) {
        const unavailableProperties = missingProperties.filter(
          (prop) => !propertyMap.has(prop)
        );

        errors.push({
          nodeId: node.id,
          nodeLabel: node.label || node.id,
          nextNodeId: nextNode.id,
          nextNodeLabel: nextNode.label || nextNode.id,
          missingProperties: unavailableProperties,
          message: `Node "${node.label || node.id}" → "${
            nextNode.label || nextNode.id
          }": Required properties not available anywhere in the system: ${unavailableProperties.join(
            ", "
          )}`,
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

type CompatibleNode = {
  nodeId: string;
  nodeLabel: string;
  action: string;
  missingProperties: string[];
  matchingProperties: string[];
  contextuallyAvailable: string[];
  isDirectlyCompatible: boolean;
  isContextuallyCompatible: boolean;
};

function getCompatibleNodes(
  sourceNodeAction: string,
  integrations: Integration[],
  allOutputProperties?: Set<string>
): CompatibleNode[] {
  const sourceIntegration = integrations.find(
    (integration) => integration.action === sourceNodeAction
  );

  if (!sourceIntegration) {
    return [];
  }

  const propertyMap = allOutputProperties ?? buildPropertyMap(integrations);

  const compatibleNodes: CompatibleNode[] = [];

  integrations.forEach((targetIntegration) => {
    if (targetIntegration.action === sourceNodeAction) {
      return;
    }

    const {
      isCompatible,
      missingProperties,
      matchingProperties,
      contextuallyAvailable,
    } = validateSchemaCompatibility(
      sourceIntegration.outputSchema,
      targetIntegration.inputSchema,
      propertyMap
    );

    if (isCompatible) {
      compatibleNodes.push({
        nodeId: targetIntegration.id,
        nodeLabel: targetIntegration.action,
        action: targetIntegration.action,
        missingProperties,
        matchingProperties,
        contextuallyAvailable,
        isDirectlyCompatible: missingProperties.length === 0,
        isContextuallyCompatible: contextuallyAvailable.length > 0,
      });
    }
  });

  return compatibleNodes;
}

function canNodesConnect(
  sourceNodeAction: string,
  targetNodeAction: string,
  integrations: Integration[],
  allOutputProperties?: Set<string>
): {
  canConnect: boolean;
  missingProperties: string[];
  matchingProperties: string[];
  contextuallyAvailable: string[];
} {
  const sourceIntegration = integrations.find(
    (integration) => integration.action === sourceNodeAction
  );
  const targetIntegration = integrations.find(
    (integration) => integration.action === targetNodeAction
  );

  if (!sourceIntegration || !targetIntegration) {
    return {
      canConnect: false,
      missingProperties: [],
      matchingProperties: [],
      contextuallyAvailable: [],
    };
  }

  const propertyMap = allOutputProperties ?? buildPropertyMap(integrations);

  const {
    isCompatible,
    missingProperties,
    matchingProperties,
    contextuallyAvailable,
  } = validateSchemaCompatibility(
    sourceIntegration.outputSchema,
    targetIntegration.inputSchema,
    propertyMap
  );

  return {
    canConnect: isCompatible,
    missingProperties,
    matchingProperties,
    contextuallyAvailable,
  };
}

export { validateFlow, getCompatibleNodes, canNodesConnect, buildPropertyMap };
export type { ValidationError, CompatibleNode };
