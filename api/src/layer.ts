import * as link from "@canmingir/link-express/link";
import actions, { type Action, builtins } from "./actions";
import start, { type Config } from "./start";
import { publicRoutes, routes } from "./routes";
import Joi from "joi";
import fs from "fs";
import { logLLM } from "./lib/llmLog";
import middleware from "./middleware";
import path from "path";
import { setLogger as setLLMLogger } from "@canmingir/link-express/llm";
import subscriptions from "./subscriptions";

type Model = NonNullable<(typeof link.points.models)["__item"]>;

const points = {
  actions: link.point<Action>("nuc.actions"),
};

const directory = path.join(__dirname, "models");

async function models(): Promise<Model[]> {
  const files = fs
    .readdirSync(directory)
    .filter((file) => /^[A-Z]\w*\.(ts|js)$/.test(file));

  const modules = await Promise.all(
    files.map((file) => import(path.join(directory, file)))
  );

  return modules.map(({ default: model }) => model);
}

function layer(config: Config): link.LayerDefinition {
  return {
    name: "nuc",
    async setup(ctx) {
      setLLMLogger(logLLM);

      const registry = ctx.define(points.actions, {
        cardinality: "keyed",
        description: "Actions agents can select, keyed by action",
        key: (action) => action.action,
        schema: Joi.object({
          action: Joi.string()
            .pattern(/^[A-Z0-9_]+:\w+$/)
            .required(),
          label: Joi.string().required(),
          description: Joi.string().required(),
          lib: Joi.string(),
          run: Joi.func(),
          approval: Joi.string().valid("external"),
        }).unknown(),
        builtins,
      });

      for (const model of await models()) {
        ctx.contribute(link.points.models, model);
      }

      for (const item of middleware) {
        ctx.contribute(link.points.middleware, item);
      }

      for (const route of publicRoutes) {
        ctx.contribute(link.points.routes, { ...route, public: true });
      }

      for (const route of routes) ctx.contribute(link.points.routes, route);

      for (const subscription of subscriptions) {
        ctx.contribute(link.points.events, subscription);
      }

      ctx.on("migrate", () => actions.bind(registry.items()));
      ctx.on("start", () => start(config));
      ctx.on("stop", () => actions.unbind());
    },
  };
}

export { points };
export default layer;
