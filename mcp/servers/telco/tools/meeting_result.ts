import { InternalToolResponse } from "./types";

export function toolResult(data: unknown): InternalToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    isError: false,
  };
}

export function toolError(error: unknown): InternalToolResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      },
    ],
    isError: true,
  };
}
