import { vite } from "@canmingir/link/vite";
import { defineConfig, mergeConfig } from "vite";

const COUPLED_PACKAGES = ["react", "react-dom", "@emotion", "@mui"];

export default async () => {
  const base = await vite();

  return defineConfig(
    mergeConfig(base, {
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
    })
  );
};
