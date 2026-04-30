import { vite } from "@canmingir/link/vite";
import { defineConfig, mergeConfig } from "vite";

export default async () => {
  const base = await vite();

  return defineConfig(
    mergeConfig(base, {
      build: {
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (id.includes("config.js") && !id.includes("node_modules")) {
                return "config";
              }
            },
          },
        },
      },
    })
  );
};
