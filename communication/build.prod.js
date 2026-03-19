#!/usr/bin/env node
"use strict";

const esbuild = require("esbuild");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

// Packages that use global singletons/registries must always be external —
// bundling them creates a second copy which breaks the registry pattern.
const SINGLETON_PACKAGES = new Set([
  "sequelize",
  "sequelize-typescript",
  "reflect-metadata",
]);

function isExternal(path) {
  const root = path.startsWith("@")
    ? path.split("/").slice(0, 2).join("/")
    : path.split("/")[0];
  if (SINGLETON_PACKAGES.has(root)) return true;
  if (path.startsWith("@canmingir/")) return false;
  return true;
}

const bundleCanmingirPlugin = {
  name: "bundle-canmingir",
  setup(build) {
    // Keep ./config external so the mounted config file overrides it at runtime
    build.onResolve({ filter: /^\.\/config$/ }, () => {
      return { external: true };
    });

    build.onResolve({ filter: /^[^./]/ }, (args) => {
      if (isExternal(args.path)) return { path: args.path, external: true };
      return null;
    });
  },
};

async function main() {
  console.log("\n[1/3] Cleaning dist...");
  fs.rmSync(path.join(ROOT, "dist"), { recursive: true, force: true });
  fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });

  console.log("\n[2/3] Bundling with esbuild...");
  await esbuild.build({
    entryPoints: [path.join(ROOT, "server.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: path.join(ROOT, "dist/server.js"),
    format: "cjs",
    plugins: [bundleCanmingirPlugin],
    loader: { ".ts": "ts" },
    logLevel: "warning",
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  });
  console.log("      Bundle created: dist/server.js");

  console.log("\n[3/3] Obfuscating...");
  run(
    [
      "npx javascript-obfuscator dist/server.js --output dist/server.js",
      "--compact true",
      "--identifier-names-generator hexadecimal",
      "--rename-globals false",
      "--string-array true",
      "--string-array-calls-transform true",
      "--string-array-calls-transform-threshold 0.5",
      "--string-array-encoding rc4",
      "--string-array-index-shift true",
      "--string-array-rotate true",
      "--string-array-shuffle true",
      "--string-array-wrappers-count 1",
      "--string-array-threshold 0.75",
      "--control-flow-flattening true",
      "--control-flow-flattening-threshold 0.5",
      "--dead-code-injection true",
      "--dead-code-injection-threshold 0.4",
      "--self-defending false",
      "--debug-protection false",
      "--numbers-to-expressions false",
      "--unicode-escape-sequence false",
    ].join(" "),
  );

  console.log("\nBuild complete! Obfuscated output in ./dist/server.js");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
