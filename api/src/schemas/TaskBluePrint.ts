import { z } from "zod";

const TaskBluePrint = {
  upsert: z.object({
    title: z.string(),
    description: z.string(),
    agentId: z.string().uuid(),
    nodes: z
      .array(
        z.object({
          id: z.string(),
          properties: z
            .object({
              label: z.string(),
              icon: z.string(),
            })
            .optional(),
          type: z.string(),
          next: z.array(z.string()).nullish(),
          true: z.array(z.string()).nullish(),
          false: z.array(z.string()).nullish(),
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
  createTaskBluePrintName: z.object({
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

export default TaskBluePrint;
