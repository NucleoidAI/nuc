import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";
import { renderReport } from "./render";
import { loadReport, SEVERITIES } from "./sarif";

const QUERY_SUITE = "javascript-security-extended";
const QUERY_PACK = `codeql/javascript-queries:codeql-suites/${QUERY_SUITE}.qls`;
const DEFAULT_OUT_DIR = "security-report";
const STEP_TIMEOUT_MS = 30 * 60 * 1000;
const FAILURE_TAIL_LINES = 20;

const USAGE = `Usage: bun run security:report [--sarif <file>] [--out <dir>]

  (no options)     Run a CodeQL security scan of the repository and build the report
  --sarif <file>   Build the report from an existing SARIF file instead of scanning
  --out <dir>      Output directory, relative to the repository root (default: ${DEFAULT_OUT_DIR})
`;

type Options = { sarif: string | null; out: string };

function parseOptions(argv: string[]): Options {
  const options: Options = { sarif: null, out: DEFAULT_OUT_DIR };
  const rest = [...argv];

  while (rest.length > 0) {
    const flag = rest.shift();

    if (flag === "--help" || flag === "-h") {
      console.log(USAGE);
      process.exit(0);
    }

    const value = rest.shift();

    if (!value) throw new Error(`Missing value for ${flag}\n\n${USAGE}`);

    if (flag === "--sarif") {
      options.sarif = value;
    } else if (flag === "--out") {
      options.out = value;
    } else {
      throw new Error(`Unknown option ${flag}\n\n${USAGE}`);
    }
  }

  return options;
}

function gitValue({ args, cwd }: { args: string[]; cwd: string }): string | null {
  const result = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "ignore" });

  if (result.exitCode !== 0) return null;

  return result.stdout.toString().trim() || null;
}

async function runStep({
  label,
  command,
  logFile,
}: {
  label: string;
  command: string[];
  logFile: string;
}): Promise<void> {
  console.log(`→ ${label}`);

  const child = Bun.spawn(command, {
    stdout: "pipe",
    stderr: "pipe",
    timeout: STEP_TIMEOUT_MS,
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = `${stdout}${stderr}`;

  appendFileSync(logFile, `$ ${command.join(" ")}\n${output}\n`);

  if (exitCode !== 0) {
    const tail = output.trim().split("\n").slice(-FAILURE_TAIL_LINES).join("\n");
    throw new Error(`${label} failed (exit ${exitCode}). Last lines:\n${tail}\n\nFull log: ${logFile}`);
  }
}

async function scan({ root, outDir }: { root: string; outDir: string }): Promise<string> {
  if (!Bun.which("codeql")) {
    throw new Error("CodeQL CLI not found on PATH. Install it with: brew install codeql");
  }

  const database = join(tmpdir(), `${basename(root)}-codeql-db`);
  const config = join(outDir, "codeql-config.yml");
  const logFile = join(outDir, "codeql.log");
  const sarifPath = join(outDir, "results.sarif");

  writeFileSync(config, `paths-ignore:\n  - ${relative(root, outDir)}\n`);
  writeFileSync(logFile, "");

  await runStep({
    label: "Building CodeQL database",
    command: [
      "codeql",
      "database",
      "create",
      database,
      "--language=javascript-typescript",
      `--source-root=${root}`,
      `--codescanning-config=${config}`,
      "--overwrite",
      "--threads=0",
    ],
    logFile,
  });

  await runStep({
    label: `Running ${QUERY_SUITE} queries`,
    command: [
      "codeql",
      "database",
      "analyze",
      database,
      QUERY_PACK,
      "--download",
      "--threads=0",
      "--format=sarif-latest",
      `--output=${sarifPath}`,
    ],
    logFile,
  });

  return sarifPath;
}

async function main(): Promise<void> {
  const options = parseOptions(Bun.argv.slice(2));
  const root = gitValue({ args: ["rev-parse", "--show-toplevel"], cwd: process.cwd() }) ?? process.cwd();
  const outDir = resolve(root, options.out);

  mkdirSync(outDir, { recursive: true });

  const sarifPath = options.sarif ? resolve(options.sarif) : await scan({ root, outDir });
  const report = loadReport(sarifPath);
  const html = renderReport({
    report,
    sourceRoot: root,
    meta: {
      project: basename(root),
      generatedAt: new Date(),
      branch: gitValue({ args: ["branch", "--show-current"], cwd: root }),
      commit: gitValue({ args: ["rev-parse", "--short", "HEAD"], cwd: root }),
      suite: QUERY_SUITE,
      sarifPath,
    },
  });
  const reportPath = join(outDir, "report.html");

  writeFileSync(reportPath, html);

  const breakdown = SEVERITIES.map(
    (severity) => `${severity} ${report.findings.filter((finding) => finding.severity === severity).length}`
  ).join(", ");

  console.log(`✓ ${report.findings.length} findings (${breakdown})`);
  console.log(`  Report: ${reportPath}`);
}

try {
  await main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
