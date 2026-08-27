import assignCertificate from "./assign_certificate";
import createPo from "./create_po";
import findProduct from "./find_product";
import getProductVendor from "./get_product_vendor";
import type { McpTool } from "../../../protocol";

const tools: McpTool[] = [
  findProduct,
  assignCertificate,
  createPo,
  getProductVendor,
];

export { tools };
