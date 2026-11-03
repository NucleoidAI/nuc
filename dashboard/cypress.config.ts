import { cypress } from "@canmingir/link/platform/cypress";
import { defineConfig } from "cypress";

export default defineConfig({
  ...cypress(),
  video: true,
});
