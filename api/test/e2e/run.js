#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const E2E_DIR = __dirname;
const API_DIR = path.resolve(E2E_DIR, "..", "..");

function suites() {
  return fs
    .readdirSync(E2E_DIR)
    .filter((file) => file.endsWith(".e2e.spec.ts"))
    .map((file) => path.basename(file, ".e2e.spec.ts"))
    .sort();
}

function parse(argv) {
  const names = [];
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split("=", 2);

    if (flag !== "--test" && flag !== "--suite") {
      rest.push(argv[i]);
      continue;
    }

    const value = inline ?? argv[++i];

    if (!value) {
      console.error(`${flag} needs a suite name. Available: ${suites().join(", ")}`);
      process.exit(1);
    }

    names.push(...value.split(","));
  }

  return { names, rest };
}

const { names, rest } = parse(process.argv.slice(2));

const files = names.map((name) => {
  const suite = name.trim().replace(/\.e2e\.spec\.ts$/, "");

  if (!suites().includes(suite)) {
    console.error(`Unknown e2e suite "${suite}". Available: ${suites().join(", ")}`);
    process.exit(1);
  }

  return path.join("test", "e2e", `${suite}.e2e.spec.ts`);
});

const result = spawnSync(
  "npx",
  ["jest", "--config", "jest.e2e.config.js", "--runInBand", ...files, ...rest],
  { stdio: "inherit", cwd: API_DIR },
);

process.exit(result.status ?? 1);
