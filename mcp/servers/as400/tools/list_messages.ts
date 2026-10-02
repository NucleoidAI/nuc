import { defineTool } from "../../../lib/mock-api-tool";

export const listMessagesTool = defineTool({
  name: "AS400:list_messages",
  description:
    "Read the QSYSOPR message queue. Messages of type INQ with an empty reply are inquiry messages waiting for an operator answer; answer them with reply_to_message. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {},
  required: [],
  request: () => ({ path: "/api/messages" }),
});
