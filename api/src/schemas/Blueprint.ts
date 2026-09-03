import { z } from "zod";

const Blueprint = {
  upsert: z.object({
    title: z.string(),
    description: z.string(),
    agentId: z.string().uuid(),
    blocking: z.boolean().optional(),
    skill: z.string().optional(),
    context: z
      .object({
        agent: z
          .object({
            name: z.string().nullish(),
            description: z.string().nullish(),
          })
          .optional(),
        knowledge: z
          .array(
            z.object({
              type: z.string().nullish(),
              question: z.string().nullish(),
              text: z.string().nullish(),
            })
          )
          .optional(),
        referenceBlueprint: z
          .object({
            id: z.string().nullish(),
            title: z.string().nullish(),
            nodeCount: z.number(),
          })
          .nullish(),
        supervising: z
          .object({
            question: z.string().nullish(),
            status: z.string().nullish(),
          })
          .nullish(),
        userRequest: z.string().nullish(),
        capturedAt: z.string().nullish(),
      })
      .passthrough()
      .optional(),
    taskId: z.string().uuid().optional(),
    nodes: z
      .array(
        z.object({
          id: z.string(),
          properties: z
            .object({
              label: z.string(),
              icon: z.string(),
              action: z.string().optional(),
              description: z.string().optional(),
              instructions: z.string().optional(),
              pseudocode: z.string().optional(),
              pseudocodeEnabled: z.boolean().optional(),
              parameters: z.record(z.string(), z.unknown()).optional(),
              targetAgentId: z.string().optional(),
              targetBlueprintId: z.string().optional(),
              force: z.boolean().optional(),
            })
            .optional(),
          type: z.string(),
          next: z.array(z.string()).nullish(),
          true: z.array(z.string()).nullish(),
          false: z.array(z.string()).nullish(),
          createdAt: z.string().optional(),
        })
      )
      .optional(),
    messages: z
      .array(
        z.object({
          content: z.string(),
          role: z.enum(["user", "assistant"]),
          createdAt: z.string().or(z.date()),
        })
      )
      .optional(),
  }),
  create: z.object({
    history: z
      .array(
        z.object({
          role: z.enum(["user", "system", "assistant"]),
          content: z.string(),
        })
      )
      .optional(),
    content: z.string(),
  }),
  createBlueprintName: z.object({
    history: z.array(
      z.object({
        role: z.enum(["user", "system", "assistant"]),
        content: z.string(),
      })
    ),
    content: z.string(),
  }),
  pseudocode: z.object({
    instructions: z.string(),
    agentId: z.string().uuid(),
  }),
  delete: z.object({
    agentId: z.string().uuid(),
  }),
  generate: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        properties: z
          .object({
            label: z.string(),
            icon: z.string(),
            action: z.string().optional(),
            description: z.string().optional(),
            instructions: z.string().optional(),
            pseudocode: z.string().optional(),
            pseudocodeEnabled: z.boolean().optional(),
          })
          .optional(),
        type: z.string(),
        next: z.array(z.string()).nullish(),
        true: z.array(z.string()).nullish(),
        false: z.array(z.string()).nullish(),
        createdAt: z.string().optional(),
      })
    ),
  }),
};

export default Blueprint;
