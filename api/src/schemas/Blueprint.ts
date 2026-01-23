import { z } from "zod";

const Blueprint = {
  upsert: z.object({
    title: z.string(),
    description: z.string(),
    agentId: z.string().uuid(),
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
