import { defineConfig } from "vite";
import { vite } from "@canmingir/link/vite";
import type { Connect } from "vite";

const redirectRoot: {
  name: string;
  configureServer: (server: { middlewares: Connect.Server }) => void;
} = {
  name: "redirect-root",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === "/") {
        res.writeHead(301, { Location: "/dashboard" });
        res.end();
      } else {
        next();
      }
    });
  },
};

export default async () => {
  const config = await vite();
  return defineConfig({
    ...config,
    plugins: [...(config.plugins ?? []), redirectRoot],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:4000",
          rewrite: (path) => path.replace(/^\/api/, ""),
          changeOrigin: true,
          timeout: 120_000,
        },
      },
    },
  });
};
