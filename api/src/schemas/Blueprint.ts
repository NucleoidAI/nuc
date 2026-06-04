import { z } from "zod";

const Blueprint = {
  upsert: z.object({
    title: z.string(),
    description: z.string(),
    agentId: z.string().uuid(),
    blocking: z.boolean().optional(),
    taskId: z.string().uuid().optional(),
    nodes: z
      .array(
        z.object({
          id: z.string(),
          properties: z
            .object({
              label: z.string(),
              prompt: z.string().optional(),
              icon: z.string(),
              action: z.string().optional(),
              description: z.string().optional(),
              pseudocode: z.string().optional(),
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
  delete: z.object({
    agentId: z.string().uuid(),
  }),
};

export default Blueprint;
