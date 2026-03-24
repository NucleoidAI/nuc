import express, { Express } from "express";

import http from "./http";
import swaggerUi from "swagger-ui-express";
import { v4 as uuid } from "uuid";

let dynamicPaths: Record<string, object> = {};
let dynamicToken = "";
let dynamicAgentId = "";
let dynamicBlueprint: Record<string, unknown> = {};
const apiDrafts: Record<
  string,
  {
    api?: unknown[];
    types?: unknown[];
    flowGraphs?: Record<string, unknown>;
  }
> = {};

export const setupSwagger = (app: Express) => {
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
  });

  app.options("/swagger/update-paths", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.put("/swagger/update-paths", express.json(), (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    dynamicPaths = req.body.paths;
    dynamicToken = req.body.token || "";
    dynamicAgentId = req.body.agentId || "";
    dynamicBlueprint = req.body.blueprint || {};
    res.json({ ok: true });
  });

  app.options("/swagger/drafts/:agentId", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.get("/swagger/drafts/:agentId", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const { agentId } = req.params;
    return res.json({ ok: true, draft: apiDrafts[agentId] || null });
  });

  app.put("/swagger/drafts/:agentId", express.json(), (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const { agentId } = req.params;
    const { api = [], types = [], flowGraphs = {} } = req.body || {};

    apiDrafts[agentId] = { api, types, flowGraphs };

    return res.json({ ok: true });
  });

  app.get("/swagger/get-token", (req, res) => {
    res.json({ token: dynamicToken });
  });

  app.options("/swagger/run-task", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.post("/swagger/run-task", express.json(), async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!dynamicToken || !dynamicAgentId) {
      return res.status(400).json({ error: "Missing token or agentId" });
    }

    const { url, status } = req.body;

    try {
      const PLACEHOLDER_ACTIONS = new Set(["REQUEST", "RESPONSE"]);

      const nodes = Object.values(dynamicBlueprint)
        .flatMap((graph: unknown) => {
          const g = graph as { nodes?: Record<string, { raw?: unknown }> };
          return Object.values(g.nodes || {}).map((node) => node.raw);
        })
        .filter((raw): raw is NonNullable<typeof raw> => {
          if (!raw) return false;
          const action = (raw as any).properties?.action;
          return !action || !PLACEHOLDER_ACTIONS.has(action);
        });

      const blueprintId = uuid();

      await http.put(
        `/blueprints/${blueprintId}`,
        {
          title: `API Blueprint - ${url}`,
          description: `Blueprint for API call to ${url}`,
          agentId: dynamicAgentId,
          nodes,
        },
        { headers: { Authorization: `Bearer ${dynamicToken}` } },
      );

      const sessionRes = await http.post(
        "/sessions",
        { type: "CHAT", agentId: dynamicAgentId },
        { headers: { Authorization: `Bearer ${dynamicToken}` } },
      );
      const sessionId = sessionRes.data.id;

      const taskRes = await http.post(
        "/tasks",
        {
          agentId: dynamicAgentId,
          description: `API call: ${url} → ${status}`,
          sessionId,
          blueprintId,
        },
        { headers: { Authorization: `Bearer ${dynamicToken}` } },
      );

      return res.json({ ok: true, task: taskRes.data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  });

  app.get("/swagger/swagger.json", (req, res) => {
    res.json({
      openapi: "3.0.0",
      info: { title: "Greycollar", version: "1.0.0" },
      servers: [
        { url: "http://localhost:3000/api", description: "Local server" },
        {
          url: "https://dashboard.land.greycollar.ai/api",
          description: "Development server",
        },
      ],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
      paths: dynamicPaths,
    });
  });

  app.use(
    "/swagger",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerUrl: "/swagger/swagger.json",
      swaggerOptions: { persistAuthorization: true },
      customJsStr: `
        const tryAutoAuth = setInterval(function () {
          if (window.ui && window.ui.getSystem) {
            clearInterval(tryAutoAuth);

            fetch("/swagger/get-token")
              .then(r => r.json())
              .then(data => {
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
            const _fetch = window.fetch;
            window.fetch = function() {
              const args = arguments;
              const req = args[0];
              const url = typeof req === "string" ? req : (req?.url || "");
              return _fetch.apply(this, args).then(response => {
                if (url.includes("localhost:3000") && response.ok) {
                  fetch("/swagger/run-task", {
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
      `,
    }),
  );
};
