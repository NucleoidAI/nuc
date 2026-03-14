import { z } from "zod";

const ConditionNode = z.object({
  id: z.string(),
  type: z.literal("CONDITION").describe("Condition node"),
  true: z.array(z.string().nullable()).nullable().describe("True node id"),
  false: z.array(z.string().nullable()).nullable().describe("False node id"),
  properties: z.object({
    label: z.string(),
    prompt: z.string().optional(),
    icon: z.string(),
    pseudocode: z.string().optional(),
  }),
});

const NormalNode = z.object({
  id: z.string(),
  type: z.literal("NORMAL").describe("Normal node"),
  next: z
    .array(z.string().nullable())
    .nullable()
    .describe("Next node id")
    .nullable(),
  properties: z.object({
    label: z.string(),
    prompt: z.string().optional(),
    icon: z.string(),
    pseudocode: z.string().optional(),
  }),
});

const Node = z.discriminatedUnion("type", [ConditionNode, NormalNode]);

export default Node;
