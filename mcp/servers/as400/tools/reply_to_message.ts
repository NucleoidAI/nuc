import { defineTool, string } from "../../../lib/mock-api-tool";

export const replyToMessageTool = defineTool({
  name: "AS400:reply_to_message",
  description:
    "Answer an inquiry message waiting on the QSYSOPR queue, the way an operator would at the green screen. Read list_messages first for the message id and the valid reply values shown in the message text. Uses the local IBM i (AS/400) enterprise mock API.",
  env: "AS400_API_URL",
  properties: {
    message_id: string("Message id from list_messages, for example M0003"),
    reply: string("Reply value, for example G to go or C to cancel"),
  },
  required: ["message_id", "reply"],
  request: (args) => ({
    path: `/api/messages/${encodeURIComponent(String(args.message_id).trim().toUpperCase())}/reply`,
    method: "POST",
    body: { reply: args.reply },
  }),
});
