#!/usr/bin/env node
"use strict";

const JavaScriptObfuscator = require("javascript-obfuscator");
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");

const OBFUSCATOR_OPTIONS = {
  compact: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.5,
  stringArrayEncoding: ["rc4"],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayThreshold: 0.75,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  selfDefending: false,
  debugProtection: false,
  numbersToExpressions: false,
  unicodeEscapeSequence: false,
};

function findTsFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTsFiles(full, results);
    } else if (entry.name.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

function copyNonTsFiles(srcDir, outDir, srcBase) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcFull = path.join(srcDir, entry.name);
    const rel = path.relative(srcBase, srcFull);
    const destFull = path.join(outDir, rel);
    if (entry.isDirectory()) {
      copyNonTsFiles(srcFull, outDir, srcBase);
    } else if (!entry.name.endsWith(".ts")) {
      const isJson = entry.name.endsWith(".json");
      const isInSeeds = srcFull.includes(path.sep + "seeds" + path.sep);
      if (isJson && !isInSeeds) continue;
      fs.mkdirSync(path.dirname(destFull), { recursive: true });
      fs.copyFileSync(srcFull, destFull);
    }
  }
}

const jsonInlinePlugin = {
  name: "json-inline",
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      let contents = fs.readFileSync(args.path, "utf8");
      contents = contents.replace(
        /^import\s+(\w+)\s+from\s+['"]([^'"]+\.json)['"]\s*;?\s*$/gm,
        (match, varName, jsonRelPath) => {
          const jsonAbsPath = path.resolve(
            path.dirname(args.path),
            jsonRelPath,
          );
          if (!fs.existsSync(jsonAbsPath)) return match;
          const jsonContent = fs.readFileSync(jsonAbsPath, "utf8");
          return `const ${varName} = ${jsonContent};`;
        },
      );
      return { contents, loader: "ts" };
    });
  },
};

const SKIP = [
  "config.ts",
  "config.land.ts",
  "config.live.ts",
  "config.kafka.ts",
  "config.txq.ts",
];
function shouldSkip(filePath) {
  const name = path.basename(filePath);
  return (
    SKIP.includes(name) ||
    filePath.includes(".test.") ||
    filePath.includes("test.ts")
  );
}

async function main() {
  console.log("\n[1/3] Cleaning dist-obfuscated...");
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const srcDirs = ["server.ts", "prepare.ts", "src"].map((d) =>
    path.join(ROOT, d),
  );
  let tsFiles = [];
  for (const d of srcDirs) {
    if (!fs.existsSync(d)) continue;
    if (fs.statSync(d).isFile()) {
      tsFiles.push(d);
    } else {
      findTsFiles(d, tsFiles);
    }
  }
  tsFiles = tsFiles.filter((f) => !shouldSkip(f));
  console.log(`\n[2/3] Transpiling ${tsFiles.length} TypeScript files...`);

  await esbuild.build({
    entryPoints: tsFiles,
    bundle: false,
    platform: "node",
    target: "node20",
    outdir: OUT,
    outbase: ROOT,
    format: "cjs",
    outExtension: { ".js": ".ts" },
    loader: { ".ts": "ts" },
    logLevel: "warning",
    plugins: [jsonInlinePlugin],
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  });

  console.log("\n[3/4] Copying non-TS assets...");
  const srcDirsForAssets = ["src"].map((d) => path.join(ROOT, d));
  for (const d of srcDirsForAssets) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
      copyNonTsFiles(d, OUT, ROOT);
    }
  }

  console.log("\n[4/4] Obfuscating...");
  const outFiles = findTsFiles(OUT);
  for (const file of outFiles) {
    const src = fs.readFileSync(file, "utf8");
    const result = JavaScriptObfuscator.obfuscate(src, OBFUSCATOR_OPTIONS);
    fs.writeFileSync(file, result.getObfuscatedCode());
  }
  console.log(`      Obfuscated ${outFiles.length} files.`);

  console.log("\nBuild complete! Output in ./dist-obfuscated/");
  console.log(
    "Docker will copy dist-obfuscated/ → /app/api/ (server runs with ts-node)",
  );
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
