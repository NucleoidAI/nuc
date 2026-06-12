import path from "path";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const API_TARGET = "http://localhost:4000";
const PORT = 3000;
const TIMEOUT_MS = 120_000;
const DASHBOARD_DIST = path.resolve(process.env.DASHBOARD_DIST!);

async function proxyRequest(
  req: Request,
  targetUrl: string,
): Promise<Response> {
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
  const file = Bun.file(path.join(DASHBOARD_DIST, subPath));

  if (await file.exists()) {
    return new Response(file);
  }

  // SPA fallback
  return new Response(Bun.file(path.join(DASHBOARD_DIST, "index.html")));
}

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/") {
      return Response.redirect("/dashboard", 301);
    }

    try {
      if (url.pathname.startsWith("/api")) {
        const newPath = url.pathname.replace(/^\/api/, "") || "/";
        console.info(
          `[Proxy] ${req.method} ${url.pathname} → ${API_TARGET}${newPath}`,
        );
        return await proxyRequest(req, `${API_TARGET}${newPath}${url.search}`);
      }

      return await serveStatic(url.pathname);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Proxy Error]", {
        path: url.pathname,
        method: req.method,
        message,
      });
      return new Response(`Proxy Error: ${message}`, {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },
});

console.log(
  `Server running on port ${server.port} [static: ${DASHBOARD_DIST}]`,
);
