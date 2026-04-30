import { defineConfig, mergeConfig } from "vite";
import { vite } from "@canmingir/link/vite";

export default async () => {
  const base = await vite();
  return defineConfig(
    mergeConfig(base, {
      resolve: {
        dedupe: ["@emotion/react", "@emotion/styled", "@emotion/css"],
      },
    })
  );
};
