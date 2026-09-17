import { isBranchNodeType, parseByNodeRef } from "../helper";

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
  required?: string[];
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
  raw?: { properties?: { parameters?: Record<string, unknown> } };
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

  const missingProperties = (inputSchema.required ?? []).filter(
    (prop) => !outputProps.includes(prop)
  );

  const contextuallyAvailable = missingProperties.filter((prop) =>
    allAvailableProperties.has(prop)
  );

  return {
    isCompatible: missingProperties.every((prop) =>
      allAvailableProperties.has(prop)
    ),
    missingProperties,
    matchingProperties,
    contextuallyAvailable,
  };
}

function validateFlow(
  graphData: { nodes: Record<string, GraphNode>; roots: string[] },
  integrations: Integration[]
): ValidationResult {
  const errors: ValidationError[] = [];
  if (!graphData?.nodes || !integrations) return { isValid: true, errors };

  const integrationMap = new Map(
    integrations.map((integration) => [integration.action, integration])
  );

  // Unbound inputs are generated from task context at runtime, and fixed values
  // are merged into those inputs. Only explicit output references require a
  // matching source node/field; input and output names need not otherwise match.
  for (const node of Object.values(graphData.nodes)) {
    if (!node.action || isBranchNodeType(node.nodeType)) continue;
    for (const [field, value] of Object.entries(
      node.raw?.properties?.parameters ?? {}
    )) {
      const ref = parseByNodeRef(value);
      if (!ref) continue;
      const source = graphData.nodes[ref.sourceNodeId];
      const outputSchema = source?.action
        ? integrationMap.get(source.action)?.outputSchema
        : undefined;
      const sourceField = ref.sourceField.split(/[.[]/, 1)[0];
      const missingSource = !source;
      const missingField =
        ref.sourceField !== "result" &&
        outputSchema?.properties !== undefined &&
        !Object.prototype.hasOwnProperty.call(
          outputSchema.properties,
          sourceField
        );
      if (!missingSource && !missingField) continue;

      const sourceLabel = source?.label || ref.sourceNodeId;
      const targetLabel = node.label || node.id;
      errors.push({
        nodeId: ref.sourceNodeId,
        nodeLabel: sourceLabel,
        nextNodeId: node.id,
        nextNodeLabel: targetLabel,
        missingProperties: [field],
        message: `Node "${targetLabel}": Input "${field}" references ${
          missingSource
            ? `missing node "${sourceLabel}"`
            : `missing output "${ref.sourceField}" on node "${sourceLabel}"`
        }.`,
      });
    }
  }
  return { isValid: errors.length === 0, errors };
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
