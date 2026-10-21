import { cypress } from "@canmingir/link/platform/cypress";
/* eslint-disable */
import { defineConfig } from "cypress";

export default defineConfig({
  ...cypress(),
  video: true,
  videosFolder: "cypress/videos",
  screenshotsFolder: "cypress/screenshots",
  screenshotOnRunFailure: true,
});

/* eslint-enable */
