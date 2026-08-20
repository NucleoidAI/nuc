#!/usr/bin/env bun
import fs from "fs";
import path from "path";

/**
 * Snapshots the .txt transcripts of one meeting into asr-versions/v<N>/ at the
 * repo root, together with a notes.txt describing which ASR model produced
 * them. Transcripts are cached next to the audio, so a version has to be taken
 * before the .txt files are deleted for the next model's run.
 *
 * bun generate-asr-version -v 1 -note "Ilk deneme" -meetingId 91514394435
 */

const ROOT = path.resolve(import.meta.dir, "..");
const MEETINGS_DIR = path.join(ROOT, "tmp", "meetings");
const VERSIONS_DIR = path.join(ROOT, "asr-versions");
const ACTION_FILE = path.join(
  ROOT,
  "api",
  "src",
  "actions",
  "transcribe_meeting_cloud.ts",
);

/**
 * Single- and double-dash flags are both accepted, so `-meetingId` works the
 * same as `--meetingId`. Anything else is rejected rather than ignored - a
 * typo'd flag would otherwise silently produce a version with a missing note.
 */
function parseArgs(argv: string[]): Record<string, string | boolean> {
  const aliases: Record<string, string> = {
    v: "version",
    n: "note",
    m: "meetingId",
    f: "force",
  };
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg.startsWith("-")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const [rawKey, inlineValue] = arg.replace(/^-+/, "").split("=", 2);
    const key = aliases[rawKey] ?? rawKey;

    if (!["version", "note", "meetingId", "model", "force"].includes(key)) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    if (key === "force") {
      flags[key] = true;
      continue;
    }

    const value = inlineValue ?? argv[++i];
    if (value === undefined || value.startsWith("-")) {
      throw new Error(`Flag ${arg} needs a value`);
    }
    flags[key] = value;
  }

  return flags;
}

/** The model actually used lives in the action, not in an env var. */
function defaultModel(): string {
  try {
    const source = fs.readFileSync(ACTION_FILE, "utf8");
    return (
      source.match(/const DEFAULT_MODEL = "([^"]+)"/)?.[1] ?? "unknown"
    );
  } catch {
    return "unknown";
  }
}

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const flags = (() => {
  try {
    return parseArgs(process.argv.slice(2));
  } catch (err) {
    fail(
      `${(err as Error).message}\n\n` +
        `Usage: bun generate-asr-version -v <version> -note "<note>" ` +
        `-meetingId <id> [-model <model>] [-force]`,
    );
  }
})();

const version = String(flags.version ?? "");
const note = String(flags.note ?? "");
const meetingId = String(flags.meetingId ?? "");
const model = String(flags.model ?? defaultModel());
const force = flags.force === true;

if (!version) fail("-v <version> is required");
if (!note) fail('-note "<note>" is required');
if (!meetingId) fail("-meetingId <id> is required");

const meetingDir = path.join(MEETINGS_DIR, meetingId);
if (!fs.existsSync(meetingDir)) {
  fail(`Meeting directory does not exist: ${meetingDir}`);
}

const transcripts = fs
  .readdirSync(meetingDir)
  .filter((f) => f.toLowerCase().endsWith(".txt"))
  .sort();

if (transcripts.length === 0) {
  fail(
    `No .txt transcripts in ${meetingDir} - run the blueprint before taking a version`,
  );
}

const versionDir = path.join(VERSIONS_DIR, `v${version}`);
const zipPath = `${versionDir}.zip`;

for (const target of [versionDir, zipPath]) {
  if (!fs.existsSync(target)) continue;
  if (!force) {
    fail(`${path.relative(ROOT, target)} already exists - pass -force to overwrite`);
  }
  fs.rmSync(target, { recursive: true, force: true });
}
fs.mkdirSync(versionDir, { recursive: true });

let totalBytes = 0;

for (const file of transcripts) {
  const from = path.join(meetingDir, file);
  fs.copyFileSync(from, path.join(versionDir, file));
  totalBytes += fs.statSync(from).size;
}

const notes = [
  `Version: v${version}`,
  `Note: ${note}`,
  `Meeting: ${meetingId}`,
  `Model: ${model}`,
  `Created: ${new Date().toISOString()}`,
  `Source: ${path.relative(ROOT, meetingDir)}`,
  "",
  `Transcripts (${transcripts.length}):`,
  ...transcripts.map(
    (f) => `  - ${f} (${fs.statSync(path.join(meetingDir, f)).size} bytes)`,
  ),
  "",
].join("\n");

fs.writeFileSync(path.join(versionDir, "notes.txt"), notes, "utf8");

/**
 * Zipped from the parent directory so the archive unpacks as v<N>/ rather than
 * scattering loose .txt files into whatever directory it is opened in.
 */
const zip = Bun.spawnSync(
  [
    "zip",
    "-rqX", // -X drops the __MACOSX/._* AppleDouble entries macOS zip adds
    path.basename(zipPath),
    `v${version}`,
    "-x",
    "*.DS_Store",
  ],
  { cwd: VERSIONS_DIR },
);

if (!zip.success) {
  const stderr = zip.stderr.toString().trim();
  fail(
    `zip failed (${stderr || `exit ${zip.exitCode}`}) - the folder ` +
      `${path.relative(ROOT, versionDir)} was still written`,
  );
}

console.log(
  `✔ v${version} → ${path.relative(ROOT, versionDir)} ` +
    `(${transcripts.length} transcripts, ${Math.round(totalBytes / 1024)}KB, model: ${model})`,
);
console.log(
  `✔ v${version} → ${path.relative(ROOT, zipPath)} ` +
    `(${Math.round(fs.statSync(zipPath).size / 1024)}KB)`,
);
