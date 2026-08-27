import { resetEmails } from "./mailbox";
import { toolMap } from "../../protocol";
import { tools } from "./tools";
import type { McpMock } from "../../protocol";

const grey: McpMock = {
  provider: "grey",
  mode: "partial",
  tools: toolMap(tools),
  reset: resetEmails,
};

export default grey;
export { sentEmails, emailsMatching, resetEmails } from "./mailbox";
