import { defineConfig } from "vite";
import { vite } from "@canmingir/link/vite";

export default async () => {
  const config = await vite();
  return defineConfig(config);
};
