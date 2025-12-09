//eslint-disable-next-line
const { startDevServer } = require("@cypress/vite-dev-server");

export default (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) => {
  on("dev-server:start", (options) => {
    return startDevServer({ options });
  });

  return config;
};
