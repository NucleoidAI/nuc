const API_TARGET = "http://localhost:4000";
const DASHBOARD_TARGET = "http://localhost:5173";
const PROMETHEUS_TARGET = "http://localhost:9464";
const PORT = 3000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const server = Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/") {
      return Response.redirect("/dashboard", 302);
    }


    const isPrometheus = url.pathname === "/api/metrics/prometheus";
    const isApi = url.pathname.startsWith("/api");

    let targetBase: string;
    let targetPath: string;

    if (isPrometheus) {
      targetBase = PROMETHEUS_TARGET;
      targetPath = "/metrics";
    } else if (isApi) {
      targetBase = API_TARGET;
      targetPath = url.pathname.replace(/^\/api/, "") || "/";
    } else {
      targetBase = DASHBOARD_TARGET;
      targetPath = url.pathname;
    }

    const targetUrl = `${targetBase}${targetPath}${url.search}`;

    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.set("connection", "close");

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? null : req.body,
        signal: req.signal,
      });

      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return new Response(null, { status: 499 });
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Proxy Error] ${req.method} ${url.pathname}:`, message);
      return new Response(`Proxy Error: ${message}`, { status: 500, headers: CORS_HEADERS });
    }
  },

});

console.log(`Proxy server running on port ${server.port}`);
