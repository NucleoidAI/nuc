import { defineConfig } from "vite";
import { vite } from "@canmingir/link/vite";

export default () => {
  return defineConfig({
    ...vite(),
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            config: ["./config.js"],
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === "config") {
              return "config.js";
            }
            return "assets/[name]-[hash].js";
          },
        },
      },
    },
  });
};
