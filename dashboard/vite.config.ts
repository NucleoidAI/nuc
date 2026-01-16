import { defineConfig } from "vite";
import { vite } from "@canmingir/link/vite";

export default async () => {
  const baseConfig = await vite();

  return defineConfig({
    ...baseConfig,
    build: {
      ...baseConfig.build,
      rollupOptions: {
        ...baseConfig.build.rollupOptions,
        output: {
          ...baseConfig.build.rollupOptions.output,
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === "config") {
              return "config.js";
            }
            return `assets/[name].[hash].js`;
          },
          manualChunks(id) {
            if (id.includes("config.js") && !id.includes("node_modules")) {
              return "config";
            }

            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          },
        },
      },
    },
  });
};
