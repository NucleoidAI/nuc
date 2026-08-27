import { resetDb } from "./db";
import { toolMap } from "../../protocol";
import { tools } from "./tools";
import type { McpMock } from "../../protocol";

const order: McpMock = {
  provider: "order",
  mode: "isolated",
  tools: toolMap(tools),
  reset: resetDb,
};

export default order;
export { db as orderDb, certificateOf, purchaseOrdersFor } from "./db";
