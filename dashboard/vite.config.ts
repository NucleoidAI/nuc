import { vite } from "@canmingir/link/vite";
import { defineConfig, mergeConfig } from "vite";

export default async () => {
  const base = await vite();

  if (
    base.build?.rollupOptions?.output &&
    !Array.isArray(base.build.rollupOptions.output)
  ) {
    delete base.build.rollupOptions.output.manualChunks;
  }

  return defineConfig(base);
};
