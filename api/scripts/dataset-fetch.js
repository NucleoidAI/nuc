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
  const haveLocal = fs.existsSync(entry.absPath);
  const skip = (detail) => ({ entry, status: "skipped", haveLocal, detail });

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
    const { value, added } = merge(readJson(entry.absPath), await res.json());
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
    return bail(credentials.reason);
  }

  const list = entries(only);
  if (!list.length) {
    return bail(`no datasets in datasets.json matched ${only.join(", ")}`);
  }

  const manifest = readManifest();
  const results = await mapLimit(list, CONCURRENCY, (e) => fetchOne(e, manifest));

  for (const r of results) {
    if (r.status === "skipped" || r.status === "cached") continue;
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
  const skipped = results.filter((r) => r.status === "skipped");
  console.log(
    `[dataset] ${list.length} datasets, ` +
      `${count("merged") + count("created")} updated, ` +
      `${count("cached")} up to date` +
      (skipped.length ? `, ${skipped.length} skipped` : "")
  );

  if (skipped.length) {
    const hint =
      !token() && skipped.length === list.length
        ? " (HF_TOKEN is not set, so private repos are unreachable)"
        : "";
    console.log(
      `[dataset] skipped: ${skipped[0].entry.name}: ${skipped[0].detail}${hint}`
    );
    const missing = skipped.filter((r) => !r.haveLocal).map((r) => r.entry.name);
    if (missing.length) {
      const log = STRICT ? console.error : console.log;
      log(
        `[dataset] no local copy for ${missing.length} dataset(s): ${missing
          .slice(0, 5)
          .join(", ")}${missing.length > 5 ? ", …" : ""}`
      );
      if (STRICT) {
        console.error(
          "[dataset] --strict: refusing to continue, the build would produce a broken artifact"
        );
        process.exit(1);
      }
    }
  }
}

main().catch((err) => {
  bail(err.message);
});
