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
    parameters: z.record(z.string(), z.unknown()).optional(),
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
  }),
});

const Node = z.discriminatedUnion("type", [
  ConditionNode,
  NormalNode,
  HandoffNode,
  ApprovalNode,
]);

export default Node;
