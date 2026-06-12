import path from "path";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const API_TARGET = "http://localhost:4000";
const VITE_TARGET = "http://localhost:5173";
const PORT = 3000;
const TIMEOUT_MS = 120_000;
const DASHBOARD_DIST = process.env.DASHBOARD_DIST
  ? path.resolve(process.env.DASHBOARD_DIST)
  : null;

interface WsData {
  targetWs: WebSocket;
}

async function proxyRequest(req: Request, targetUrl: string): Promise<Response> {
  const headers = new Headers(req.headers);
  headers.delete("host");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // @ts-ignore — Bun requires this for streaming request bodies
    duplex: "half",
  });

  const responseHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    responseHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

async function serveStatic(pathname: string): Promise<Response> {
  const subPath = pathname.replace(/^\/dashboard\/?/, "") || "index.html";
  const file = Bun.file(path.join(DASHBOARD_DIST!, subPath));

  if (await file.exists()) {
    return new Response(file);
  }

  // SPA fallback
  return new Response(Bun.file(path.join(DASHBOARD_DIST!, "index.html")));
}

const server = Bun.serve<WsData>({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/") {
      return Response.redirect("/dashboard", 301);
    }

    // WebSocket upgrade — dev only (Vite HMR), skipped when serving static files
    if (!DASHBOARD_DIST && req.headers.get("upgrade")?.toLowerCase() === "websocket") {
      const protocol = req.headers.get("sec-websocket-protocol");
      const wsTarget = `ws://localhost:5173${url.pathname}${url.search}`;
      const targetWs = protocol
        ? new WebSocket(wsTarget, protocol.split(",").map((p) => p.trim()))
        : new WebSocket(wsTarget);
      const upgraded = server.upgrade(req, {
        data: { targetWs },
        headers: protocol ? { "sec-websocket-protocol": protocol } : {},
      });
      if (upgraded) return undefined as unknown as Response;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    try {
      if (url.pathname.startsWith("/api")) {
        const newPath = url.pathname.replace(/^\/api/, "") || "/";
        console.info(`[Proxy] ${req.method} ${url.pathname} → ${API_TARGET}${newPath}`);
        return await proxyRequest(req, `${API_TARGET}${newPath}${url.search}`);
      }

      if (DASHBOARD_DIST) {
        return await serveStatic(url.pathname);
      }

      return await proxyRequest(req, `${VITE_TARGET}${url.pathname}${url.search}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Proxy Error]", { path: url.pathname, method: req.method, message });
      return new Response(`Proxy Error: ${message}`, {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },

  websocket: {
    open(ws) {
      const { targetWs } = ws.data;
      const forward = (event: MessageEvent) => ws.send(event.data);
      targetWs.onerror = () => ws.close();
      targetWs.onclose = () => ws.close();
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.onmessage = forward;
      } else {
        targetWs.onopen = () => { targetWs.onmessage = forward; };
      }
    },
    message(ws, message) {
      const { targetWs } = ws.data;
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(message);
      }
    },
    close(ws) {
      const { targetWs } = ws.data;
      if (targetWs.readyState === WebSocket.CONNECTING) {
        targetWs.onopen = () => targetWs.close(1001, "Going Away");
        targetWs.onerror = () => {};
      } else if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.close(1001, "Going Away");
      }
    },
  },
});

console.log(`Proxy server running on port ${server.port} [${DASHBOARD_DIST ? `static: ${DASHBOARD_DIST}` : "dev proxy → Vite"}]`);
