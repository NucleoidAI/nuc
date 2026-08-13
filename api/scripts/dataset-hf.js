"use strict";

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.join(__dirname, "..");
const REPO_ROOT = path.join(ROOT, "..");
const DATASET_DIR = path.join(ROOT, "src", "dataset");
const MANIFEST = path.join(DATASET_DIR, ".hf-manifest.json");
const DATASETS = require(path.join(DATASET_DIR, "datasets.json"));

dotenv.config({ path: path.join(REPO_ROOT, ".env.local"), quiet: true });
dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });

const REVISION = process.env.HF_DATASET_REVISION || "main";

function token() {
  return process.env.HF_TOKEN || "";
}

function authHeaders(extra = {}) {
  const t = token();
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
}

function namespaceOrNull() {
  return process.env.HF_DATASET_NAMESPACE || null;
}

function namespace() {
  const ns = namespaceOrNull();
  if (!ns) {
    throw new Error(
      "HF_DATASET_NAMESPACE is not set (the Hugging Face user or org that owns the dataset repos)"
    );
  }
  return ns;
}

async function checkCredentials() {
  if (!namespaceOrNull()) return { ok: false, reason: "HF_DATASET_NAMESPACE is not set" };
  if (!token()) return { ok: true };
  try {
    const res = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: authHeaders(),
    });
    if (res.ok) return { ok: true };
    return { ok: false, reason: `HF_TOKEN rejected (${res.status} ${res.statusText})` };
  } catch (err) {
    return { ok: false, reason: `Hugging Face unreachable (${err.message})` };
  }
}

function entries(only) {
  const ns = namespace();
  const wanted = only && only.length ? new Set(only) : null;
  return Object.entries(DATASETS)
    .filter(([name]) => !wanted || wanted.has(name))
    .map(([name, localPath]) => ({
      name,
      repo: `${ns}/${name}`,
      localPath,
      absPath: path.join(DATASET_DIR, ...localPath.split("/")),
      remoteFile: path.posix.basename(localPath),
    }));
}

async function remoteInfo(repo, revision = REVISION) {
  const url = `https://huggingface.co/api/datasets/${repo}/revision/${encodeURIComponent(
    revision
  )}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(
      `${repo}@${revision}: ${res.status} ${res.statusText}` +
        (res.status === 401 || res.status === 404
          ? " (private repo: check HF_TOKEN and HF_DATASET_NAMESPACE)"
          : "")
    );
  }
  const body = await res.json();
  return {
    sha: body.sha,
    files: (body.siblings || [])
      .map((s) => s.rfilename)
      .filter((f) => f !== ".gitattributes" && f !== "README.md"),
  };
}

function downloadUrl(repo, sha, file) {
  return `https://huggingface.co/datasets/${repo}/resolve/${sha}/${file}`;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function mergeArrays(local, remote) {
  const seen = new Set(local.map(canonical));
  const added = remote.filter((item) => !seen.has(canonical(item)));
  return { value: local.concat(added), added: added.length };
}

function merge(local, remote) {
  if (local === undefined) {
    const size = Array.isArray(remote)
      ? remote.length
      : Array.isArray(remote && remote.data)
      ? remote.data.length
      : 0;
    return { value: remote, added: size };
  }

  if (Array.isArray(local) && Array.isArray(remote)) {
    return mergeArrays(local, remote);
  }

  if (
    local &&
    remote &&
    typeof local === "object" &&
    typeof remote === "object" &&
    Array.isArray(local.data) &&
    Array.isArray(remote.data)
  ) {
    const { value, added } = mergeArrays(local.data, remote.data);
    return { value: { ...remote, ...local, data: value }, added };
  }

  return { value: local, added: 0 };
}

function readJson(file) {
  if (!fs.existsSync(file)) return undefined;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    return { entries: {} };
  }
}

function writeManifest(data) {
  fs.writeFileSync(MANIFEST, JSON.stringify(data, null, 2) + "\n");
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}

module.exports = {
  DATASETS,
  DATASET_DIR,
  MANIFEST,
  REVISION,
  authHeaders,
  checkCredentials,
  downloadUrl,
  entries,
  mapLimit,
  merge,
  namespace,
  namespaceOrNull,
  readJson,
  readManifest,
  remoteInfo,
  token,
  writeJson,
  writeManifest,
};
