import { vite } from "@canmingir/link/vite";
import { defineConfig, mergeConfig } from "vite";

export default async () => {
  const base = await vite();

  const baseManualChunks = base.build?.rollupOptions?.output?.manualChunks;

  return defineConfig(
    mergeConfig(base, {
      resolve: {
        dedupe: ["@emotion/react", "@emotion/styled", "@emotion/css"],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              // Keep @emotion and @mui in the same chunk to avoid TDZ errors
              if (
                id.includes("node_modules/@emotion") ||
                id.includes("node_modules/@mui")
              ) {
                return "mui";
              }
              if (typeof baseManualChunks === "function") {
                return baseManualChunks(id, {} as never);
              }
            },
          },
        },
      },
    })
  );
};
