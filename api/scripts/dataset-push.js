#!/usr/bin/env node
"use strict";

const fs = require("fs");
const {
  REVISION,
  authHeaders,
  entries,
  mapLimit,
  namespace,
  readManifest,
  token,
  writeManifest,
} = require("./dataset-hf");

const CONCURRENCY = 4;
const KNOWN_FLAGS = new Set(["--create", "-m", "--message"]);
const argv = process.argv.slice(2);

const unknown = argv.filter((a) => a.startsWith("-") && !KNOWN_FLAGS.has(a));
if (unknown.length) {
  console.error(
    `[dataset] unknown flag ${unknown.join(", ")} (expected ${[
      ...KNOWN_FLAGS,
    ].join(", ")})`
  );
  process.exit(1);
}

const CREATE = argv.includes("--create");
const msgIdx = argv.findIndex((a) => a === "-m" || a === "--message");
const SUMMARY = msgIdx !== -1 ? argv[msgIdx + 1] : "Update dataset";
const only = argv.filter(
  (a, i) => !a.startsWith("-") && !(msgIdx !== -1 && i === msgIdx + 1)
);

async function createRepo(entry) {
  const res = await fetch("https://huggingface.co/api/repos/create", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      type: "dataset",
      name: entry.name,
      organization: namespace(),
      private: true,
    }),
  });
  if (res.ok) return "created";
  const body = await res.text();
  if (res.status === 409 || /already (created|exists)/i.test(body)) {
    return "exists";
  }
  throw new Error(`${entry.name}: create failed ${res.status} ${body}`);
}

async function pushOne(entry) {
  if (!fs.existsSync(entry.absPath)) {
    throw new Error(`${entry.name}: ${entry.localPath} not found`);
  }
  if (CREATE) await createRepo(entry);

  const lines = [
    JSON.stringify({ key: "header", value: { summary: SUMMARY } }),
    JSON.stringify({
      key: "file",
      value: {
        path: entry.remoteFile,
        content: fs.readFileSync(entry.absPath).toString("base64"),
        encoding: "base64",
      },
    }),
  ];

  const res = await fetch(
    `https://huggingface.co/api/datasets/${entry.repo}/commit/${encodeURIComponent(
      REVISION
    )}`,
    {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/x-ndjson" }),
      body: lines.join("\n") + "\n",
    }
  );
  if (!res.ok) {
    throw new Error(
      `${entry.name}: commit failed ${res.status} ${await res.text()}` +
        (res.status === 404 && !CREATE
          ? ` — ${entry.repo} does not exist yet, re-run with --create`
          : "")
    );
  }
  const body = await res.json();
  return { entry, sha: body.commitOid || body.oid || "" };
}

async function main() {
  if (!token()) {
    throw new Error("HF_TOKEN is not set (needs write access to the dataset repos)");
  }

  const list = entries(only);
  if (!list.length) {
    throw new Error(`No datasets in datasets.json matched ${only.join(", ")}`);
  }

  const manifest = readManifest();
  const results = await mapLimit(list, CONCURRENCY, pushOne);

  for (const r of results) {
    manifest.entries[r.entry.name] = {
      repo: r.entry.repo,
      file: r.entry.remoteFile,
      sha: r.sha,
      fetchedAt: new Date().toISOString(),
    };
    console.log(`[dataset] pushed ${r.entry.repo}@${r.sha.slice(0, 7)}`);
  }

  manifest.revision = REVISION;
  writeManifest(manifest);
  console.log(`[dataset] ${results.length} datasets pushed`);
}

main().catch((err) => {
  console.error(`[dataset] ${err.message}`);
  process.exit(1);
});
