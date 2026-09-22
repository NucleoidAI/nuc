import { listBucketsTool } from "./list_buckets";
import { listObjectsTool } from "./list_objects";
import { getObjectMetadataTool } from "./get_object_metadata";
import { getObjectTool } from "./get_object";
import { putObjectTool } from "./put_object";
import { copyObjectTool } from "./copy_object";
import { moveObjectTool } from "./move_object";
import { deleteObjectTool } from "./delete_object";
import { downloadUrlTool } from "./download_url";
import { uploadUrlTool } from "./upload_url";

export const tools = [
  listBucketsTool,
  listObjectsTool,
  getObjectMetadataTool,
  getObjectTool,
  putObjectTool,
  copyObjectTool,
  moveObjectTool,
  deleteObjectTool,
  downloadUrlTool,
  uploadUrlTool,
];
