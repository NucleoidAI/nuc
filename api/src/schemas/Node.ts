import { z } from "zod";

const ConditionNode = z.object({
  id: z.string(),
  type: z.literal("CONDITION"),
  true: z.array(z.string().nullable()).nullable(),
  false: z.array(z.string().nullable()).nullable(),
  properties: z.object({
    label: z.string(),
    icon: z.string(),
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
    force: z.boolean().optional(),
  }),
});

const Node = z.discriminatedUnion("type", [ConditionNode, NormalNode, HandoffNode]);

export default Node;
