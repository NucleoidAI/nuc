import { checkProductCountTool } from "./check_product_count";
import { createOrderTool } from "./create_order";
import { reduceProductCountTool } from "./reduce_product_count";
import { increaseProductCountTool } from "./increase_product_count";
import { getAllProductsTool } from "./get_all_products";
import { getProductByIdTool } from "./get_product_by_id";
import { getProductsByCategoryTool } from "./get_products_by_category";
import { createProductTool } from "./create_product";
import { updateProductTool } from "./update_product";
import { deleteProductTool } from "./delete_product";
import { sendEmailTool } from "./send_email";
import { sendEmailEwsTool } from "./send_email_ews";

export const tools = [
  checkProductCountTool,
  createOrderTool,
  reduceProductCountTool,
  increaseProductCountTool,
  getAllProductsTool,
  getProductByIdTool,
  getProductsByCategoryTool,
  createProductTool,
  updateProductTool,
  deleteProductTool,
  sendEmailTool,
  sendEmailEwsTool,
];
