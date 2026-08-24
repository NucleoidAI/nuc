#!/usr/bin/env node
"use strict";

const fs = require("fs");
const {
  REVISION,
  authHeaders,
  checkCredentials,
  downloadUrl,
  entries,
  mapLimit,
  merge,
  readJson,
  readManifest,
  remoteInfo,
  token,
  writeJson,
  writeManifest,
} = require("./dataset-hf");

const CONCURRENCY = 6;
const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict") || process.env.HF_DATASET_STRICT === "1";
const only = argv.filter((a) => !a.startsWith("-"));

function bail(message) {
  if (STRICT) {
    console.error(`[dataset] ${message}`);
    process.exit(1);
  }
  console.log(`[dataset] ${message} — skipping fetch`);
}

async function fetchOne(entry, manifest) {
  const cached = manifest.entries[entry.name];
  const haveLocal = fs.existsSync(entry.absPath) && !(cached && cached.placeholder);

  const skip = (detail) => {
    if (haveLocal || STRICT) {
      return { entry, status: "skipped", haveLocal, detail };
    }
    writeJson(entry.absPath, []);
    return { entry, status: "placeholder", haveLocal: false, detail };
  };

  let info;
  try {
    info = await remoteInfo(entry.repo, REVISION);
  } catch (err) {
    return skip(err.message);
  }

  if (cached && cached.sha === info.sha && haveLocal) {
    return { entry, status: "cached", sha: info.sha };
  }

  const file = info.files.includes(entry.remoteFile)
    ? entry.remoteFile
    : info.files.find((f) => f.endsWith(".json"));
  if (!file) {
    return skip(`no JSON file in ${entry.repo}@${info.sha.slice(0, 7)}`);
  }

  try {
    const res = await fetch(downloadUrl(entry.repo, info.sha, file), {
      headers: authHeaders(),
    });
    if (!res.ok) {
      return skip(`download failed ${res.status} ${res.statusText}`);
    }
    const remote = await res.json();
    const local = cached && cached.placeholder ? undefined : readJson(entry.absPath);
    const { value, added } = merge(local, remote);
    writeJson(entry.absPath, value);
    return {
      entry,
      status: haveLocal ? "merged" : "created",
      sha: info.sha,
      file,
      added,
    };
  } catch (err) {
    return skip(err.message);
  }
}

async function main() {
  const credentials = await checkCredentials();
  if (!credentials.ok) {
    console.error(`[dataset] ${credentials.reason}`);
    process.exit(1);
  }

  const list = entries(only);
  if (!list.length) {
    return bail(`no datasets in datasets.json matched ${only.join(", ")}`);
  }

  const manifest = readManifest();
  const results = await mapLimit(list, CONCURRENCY, (e) => fetchOne(e, manifest));

  for (const r of results) {
    if (r.status === "cached") continue;
    if (r.status === "placeholder") {
      manifest.entries[r.entry.name] = {
        repo: r.entry.repo,
        placeholder: true,
        writtenAt: new Date().toISOString(),
      };
      continue;
    }
    if (r.status === "skipped") continue;
    manifest.entries[r.entry.name] = {
      repo: r.entry.repo,
      file: r.file,
      sha: r.sha,
      fetchedAt: new Date().toISOString(),
    };
    console.log(
      `[dataset] ${r.entry.name}: ${r.status}` +
        (r.status === "merged" ? ` (+${r.added} examples)` : "")
    );
  }

  manifest.revision = REVISION;
  writeManifest(manifest);

  const count = (status) => results.filter((r) => r.status === status).length;
  const unresolved = results.filter(
    (r) => r.status === "skipped" || r.status === "placeholder"
  );
  console.log(
    `[dataset] ${list.length} datasets, ` +
      `${count("merged") + count("created")} updated, ` +
      `${count("cached")} up to date` +
      (unresolved.length ? `, ${unresolved.length} skipped` : "")
  );

  if (!unresolved.length) return;

  const hint =
    !token() && unresolved.length === list.length
      ? " (HF_TOKEN is not set, so private repos are unreachable)"
      : "";
  const log = STRICT ? console.error : console.log;
  log(`[dataset] skipped: ${unresolved[0].entry.name}: ${unresolved[0].detail}${hint}`);

  const placeholders = results.filter((r) => r.status === "placeholder");
  if (placeholders.length) {
    console.log(
      `[dataset] wrote ${placeholders.length} empty placeholder(s) so the imports resolve: ` +
        placeholders
          .slice(0, 5)
          .map((r) => r.entry.name)
          .join(", ") +
        (placeholders.length > 5 ? ", …" : "")
    );
    console.log(
      "[dataset] the agent will run WITHOUT few-shot examples until these are fetched for real"
    );
  }

  const missing = unresolved.filter((r) => !r.haveLocal);
  if (STRICT && missing.length) {
    console.error(
      `[dataset] no usable copy for ${missing.length} dataset(s): ${missing
        .slice(0, 5)
        .map((r) => r.entry.name)
        .join(", ")}${missing.length > 5 ? ", …" : ""}`
    );
    console.error(
      "[dataset] --strict: refusing to continue, the build would produce a broken artifact"
    );
    process.exit(1);
  }
}

main().catch((err) => {
  bail(err.message);
});
