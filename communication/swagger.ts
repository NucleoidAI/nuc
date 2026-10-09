import express, { Express, RequestHandler, Router } from "express";

import http from "./http";
import swaggerUi from "swagger-ui-express";
import { v4 as uuid } from "uuid";

const DEFAULT_SWAGGER_PORT = 3004;
const DEFAULT_API_SERVER_URL = "http://localhost:3000/api";
const DEFAULT_API_SERVER_DESCRIPTION = "Local server";
const DEVELOPMENT_API_SERVER_URL = "https://dashboard.land.greycollar.ai/api";
const DEVELOPMENT_API_SERVER_DESCRIPTION = "Development server";
const PLACEHOLDER_ACTIONS = new Set(["REQUEST", "RESPONSE"]);

type BlueprintNode = {
  properties?: {
    action?: string;
  };
};

type BlueprintGraph = {
  nodes?: Record<string, { raw?: BlueprintNode }>;
};

type Draft = {
  api?: unknown[];
  types?: unknown[];
  flowGraphs?: Record<string, unknown>;
};

type SwaggerState = {
  paths: Record<string, object>;
  token: string;
  agentId: string;
  blueprint: Record<string, BlueprintGraph>;
  drafts: Record<string, Draft>;
};

const swaggerPort = Number(process.env.SWAGGER_PORT || DEFAULT_SWAGGER_PORT);
const swaggerBaseUrl = `http://localhost:${swaggerPort}`;
const jsonBodyParser = express.json();

const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const isUnsafeObjectKey = (key: string) => UNSAFE_OBJECT_KEYS.has(key);

const state: SwaggerState = {
  paths: {},
  token: "",
  agentId: "",
  blueprint: {},
  drafts: {},
};

const allowAllFrames: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
};

const allowCors: RequestHandler = (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
};

const buildSwaggerDocument = () => ({
  openapi: "3.0.0",
  info: {
    title: "Greycollar",
    version: "1.0.0",
  },
  servers: [
    {
      url: DEFAULT_API_SERVER_URL,
      description: DEFAULT_API_SERVER_DESCRIPTION,
    },
    {
      url: DEVELOPMENT_API_SERVER_URL,
      description: DEVELOPMENT_API_SERVER_DESCRIPTION,
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: state.paths,
});

const resetSwaggerState = () => {
  state.paths = {};
  state.token = "";
  state.agentId = "";
  state.blueprint = {};
  state.drafts = {};
};

const getBlueprintNodes = () =>
  Object.values(state.blueprint)
    .flatMap((graph) =>
      Object.values(graph.nodes || {}).map((node) => node.raw),
    )
    .filter((raw): raw is BlueprintNode => {
      if (!raw) return false;
      const action = raw.properties?.action;
      return !action || !PLACEHOLDER_ACTIONS.has(action);
    });

const buildSwaggerCustomJs = () => `
  const tryAutoAuth = setInterval(function () {
    if (window.ui && window.ui.getSystem) {
      clearInterval(tryAutoAuth);

      fetch("${swaggerBaseUrl}/swagger/token")
        .then((response) => response.json())
        .then((data) => {
          if (data.token) {
            window.ui.getSystem().authActions.authorize({
              bearerAuth: {
                name: "bearerAuth",
                schema: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
                value: data.token,
              },
            });
          }
        });

      const originalFetch = window.fetch;
      window.fetch = function () {
        const args = arguments;
        const request = args[0];
        const url = typeof request === "string" ? request : (request && request.url) || "";

        return originalFetch.apply(this, args).then((response) => {
          if (url.includes("localhost:3000") && response.ok) {
            fetch("${swaggerBaseUrl}/swagger/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url, status: response.status }),
            }).catch(() => {});
          }

          return response;
        });
      };
    }
  }, 100);
`;

const createSwaggerApiRouter = () => {
  const router = Router();

  router.use(allowCors);

  router
    .route(["/paths", "/update-paths"])
    .options((_req, res) => {
      res.setHeader("Access-Control-Allow-Methods", "PUT");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.sendStatus(204);
    })
    .put(jsonBodyParser, (req, res) => {
      state.paths = req.body.paths || {};
      state.token = req.body.token || "";
      state.agentId = req.body.agentId || "";
      state.blueprint = req.body.blueprint || {};
      res.json({ ok: true });
    });

  router
    .route("/drafts/:agentId")
    .options((_req, res) => {
      res.setHeader("Access-Control-Allow-Methods", "GET,PUT");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.sendStatus(204);
    })
    .get((req, res) => {
      const { agentId } = req.params;
      if (isUnsafeObjectKey(agentId)) {
        return res.status(400).json({ error: "Invalid agentId" });
      }
      res.json({ ok: true, draft: state.drafts[agentId] || null });
    })
    .put(jsonBodyParser, (req, res) => {
      const { agentId } = req.params;
      if (isUnsafeObjectKey(agentId)) {
        return res.status(400).json({ error: "Invalid agentId" });
      }
      const { api = [], types = [], flowGraphs = {} } = req.body || {};

      state.drafts[agentId] = { api, types, flowGraphs };
      res.json({ ok: true });
    });

  router.get(["/token", "/get-token"], (_req, res) => {
    res.json({ token: state.token });
  });

  router
    .route(["/tasks", "/run-task"])
    .options((_req, res) => {
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.sendStatus(204);
    })
    .post(jsonBodyParser, async (req, res) => {
      if (!state.token || !state.agentId) {
        return res.status(400).json({ error: "Missing token or agentId" });
      }

      const { url, status } = req.body;

      try {
        const blueprintId = uuid();

        await http.put(
          `/blueprints/${blueprintId}`,
          {
            title: `API Blueprint - ${url}`,
            description: `Blueprint for API call to ${url}`,
            agentId: state.agentId,
            nodes: getBlueprintNodes(),
          },
          { headers: { Authorization: `Bearer ${state.token}` } },
        );

        const sessionRes = await http.post(
          "/sessions",
          { type: "CHAT", agentId: state.agentId },
          { headers: { Authorization: `Bearer ${state.token}` } },
        );

        const taskRes = await http.post(
          "/tasks",
          {
            agentId: state.agentId,
            description: `API call: ${url} \u2192 ${status}`,
            sessionId: sessionRes.data.id,
            blueprintId,
          },
          { headers: { Authorization: `Bearer ${state.token}` } },
        );

        return res.json({ ok: true, task: taskRes.data });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: message });
      }
    });

  router.get("/swagger.json", (_req, res) => {
    res.json(buildSwaggerDocument());
  });

  router.post("/reset", (_req, res) => {
    resetSwaggerState();
    res.json({ ok: true });
  });

  return router;
};

export const setupSwagger = (app: Express) => {
  app.use(allowAllFrames);
  app.use("/swagger", createSwaggerApiRouter());
  app.use(
    "/swagger",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerUrl: `${swaggerBaseUrl}/swagger/swagger.json`,
      swaggerOptions: { persistAuthorization: true },
      customJsStr: buildSwaggerCustomJs(),
    }),
  );
};
