import { $ } from "bun";
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dir, "..");
const out = path.join(root, "npm");
const api = path.join(root, "api");
const dashboard = path.join(root, "dashboard");

const read = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));

const manifest = read(path.join(root, "package.json"));

const common = {
  version: manifest.version,
  license: "Apache-2.0",
  repository: {
    type: "git",
    url: "git+https://github.com/NucleoidAI/nuc.git",
  },
  publishConfig: { access: "public" },
};

function write(dir: string, pkg: Record<string, unknown>) {
  for (const file of ["README.md", "LICENSE"]) {
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }

  fs.writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`,
  );

  console.log(`[package] ${pkg.name}@${pkg.version} built in ${dir}`);
}

fs.rmSync(out, { recursive: true, force: true });

const nuc = path.join(out, "nuc");

const { exitCode } = await $`bunx tsc -p tsconfig.package.json`
  .cwd(api)
  .nothrow();

if (exitCode !== 0 && exitCode !== 2) {
  process.exit(exitCode);
}

if (!fs.existsSync(path.join(nuc, "api", "src", "layer.js"))) {
  console.error("[package] api build produced no output");
  process.exit(1);
}

write(nuc, {
  name: "@nucleoidai/nuc",
  description: manifest.description,
  ...common,
  main: "api/src/layer.js",
  types: "api/src/layer.d.ts",
  dependencies: {
    ...read(path.join(api, "package.json")).dependencies,
    ...read(path.join(root, "mcp", "package.json")).dependencies,
  },
});

const ui = path.join(out, "nuc-dashboard");

const test = /(^|\/)(__tests__|__mocks__)(\/|$)|\.(test|spec)\.[jt]sx?$/;

const entries = fs
  .readdirSync(dashboard)
  .filter(
    (entry) =>
      ["src", "public", "index.html", "routes.tsx"].includes(entry) ||
      /^config(\.[\w-]+)?\.ts$/.test(entry),
  );

for (const entry of entries) {
  fs.cpSync(path.join(dashboard, entry), path.join(ui, entry), {
    recursive: true,
    filter: (source) => !test.test(path.relative(dashboard, source)),
  });
}

write(ui, {
  name: "@nucleoidai/nuc-dashboard",
  description: "Dashboard source of nuc, extended by applications built on it.",
  ...common,
  type: "module",
});
