import { ApiFieldsSchema, ApiTimeout } from "./ApiField";
import { z } from "zod";

const ConditionNode = z.object({
  id: z.string(),
  type: z.literal("CONDITION"),
  true: z.array(z.string().nullable()).nullable(),
  false: z.array(z.string().nullable()).nullable(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    instructions: z.string().optional(),
    pseudocode: z.string().optional(),
    pseudocodeEnabled: z.boolean().optional(),
    force: z.boolean().optional(),
    pinned: z.boolean().optional(),
  }),
});

const NormalNode = z.object({
  id: z.string(),
  type: z.literal("NORMAL"),
  next: z.array(z.string().nullable()).nullable().nullable(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    instructions: z.string().optional(),
    pseudocode: z.string().optional(),
    pseudocodeEnabled: z.boolean().optional(),
    force: z.boolean().optional(),
    pinned: z.boolean().optional(),
    parameters: z.record(z.string(), z.unknown()).optional(),
  }),
});

const SwitchNode = z.object({
  id: z.string(),
  type: z.literal("SWITCH"),
  next: z.array(z.string().nullable()).nullable(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    instructions: z.string().optional(),
    pseudocode: z.string().optional(),
    pseudocodeEnabled: z.boolean().optional(),
    force: z.boolean().optional(),
    pinned: z.boolean().optional(),
    cases: z
      .array(
        z.object({
          nodeId: z.string(),
          label: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

const HandoffNode = z.object({
  id: z.string(),
  type: z.literal("HANDOFF"),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    targetAgentId: z.string().optional(),
    targetBlueprintId: z.string().optional(),
    instructions: z.string().optional(),
    pseudocode: z.string().optional(),
    pseudocodeEnabled: z.boolean().optional(),
    force: z.boolean().optional(),
    pinned: z.boolean().optional(),
  }),
});

const ApprovalNode = z.object({
  id: z.string(),
  type: z.literal("APPROVAL"),
  true: z.array(z.string().nullable()).nullable(),
  false: z.array(z.string().nullable()).nullable(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    question: z.string().optional(),
    instructions: z.string().optional(),
    pseudocode: z.string().optional(),
    pseudocodeEnabled: z.boolean().optional(),
    force: z.boolean().optional(),
    pinned: z.boolean().optional(),
  }),
});

const StartNode = z.object({
  id: z.string(),
  type: z.literal("START"),
  next: z.array(z.string().nullable()).nullable(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    fields: ApiFieldsSchema,
    strict: z.boolean().optional(),
    timeout: ApiTimeout.optional(),
  }),
});

const EndNode = z.object({
  id: z.string(),
  type: z.literal("END"),
  next: z.array(z.string().nullable()).nullable().optional(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    fields: ApiFieldsSchema,
    parameters: z.record(z.string(), z.unknown()).optional(),
  }),
});

const Node = z.discriminatedUnion("type", [
  ConditionNode,
  NormalNode,
  SwitchNode,
  HandoffNode,
  ApprovalNode,
  StartNode,
  EndNode,
]);

export default Node;
