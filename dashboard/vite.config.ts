import { defineConfig } from "vite";
import { vite } from "@canmingir/link/vite";

export default async () => {
  const base = await vite();
  return defineConfig({
    ...base,
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        clientPort: 5173,
      },
    },
  });
};
