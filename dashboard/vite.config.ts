import { defineConfig } from "vite";
import { vite } from "@canmingir/link/vite";

export default async () => {
  const config = await vite();
  config.server = {
    ...config.server,
    host: true,
    proxy: {
      ...config.server?.proxy,
      "/socket.io": {
        target: "http://localhost:3003",
        changeOrigin: true,
        ws: true,
      },
    },
  };
  return defineConfig(config);
};
