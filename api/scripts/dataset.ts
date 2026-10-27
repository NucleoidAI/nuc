import fs from "fs";
import os from "os";
import path from "path";

import { file } from "@canmingir/link-express/dataset";

const ORGANIZATION = "greycollar";
const DATASET_SRC = path.join(__dirname, "..", "src", "dataset");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

function datasets(): string[] {
  const names = new Set<string>();

  for (const source of sources(DATASET_SRC)) {
    const contents = fs.readFileSync(source, "utf8");
    for (const [, name] of contents.matchAll(
      /\bload\(\s*["']([\w-]+)["']\s*,?\s*\)/g,
    )) {
      names.add(name);
    }
  }

  return [...names].sort();
}

function token(): string | undefined {
  if (process.env.HF_TOKEN) {
    return process.env.HF_TOKEN;
  }

  const home =
    process.env.HF_HOME ?? path.join(os.homedir(), ".cache", "huggingface");
  const location = path.join(home, "token");

  return fs.existsSync(location)
    ? fs.readFileSync(location, "utf8").trim()
    : undefined;
}

async function download(name: string, auth: string) {
  const url = `https://huggingface.co/datasets/${ORGANIZATION}/${name}/resolve/main/data/train.jsonl`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${auth}` },
  });

  if (!response.ok) {
    throw new Error(`${name}: ${response.status} ${response.statusText}`);
  }

  const data = (await response.text())
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));

  const location = file(name, DATASET_SRC);
  const temp = `${location}.${process.pid}.tmp`;

  fs.mkdirSync(path.dirname(location), { recursive: true });
  fs.writeFileSync(temp, JSON.stringify({ data }, null, 2));
  fs.renameSync(temp, location);
}

async function main() {
  const auth = token();

  if (!auth) {
    if (process.env.CI) {
      console.error(
        `[dataset] No Hugging Face token found. Set HF_TOKEN or run "hf auth login".`,
      );
      process.exit(1);
    }
    return;
  }

  const results = await Promise.allSettled(
    datasets().map((name) => download(name, auth)),
  );
  const failed = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  for (const { reason } of failed) {
    console.error(`[dataset] ${reason.message}`);
  }

  if (failed.length) {
    process.exit(1);
  }
}

main();
