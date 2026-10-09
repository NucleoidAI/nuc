import { existsSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PDF_TIMEOUT_MS = 2 * 60 * 1000;
const FONT_LOAD_BUDGET_MS = 10_000;

const BROWSER_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];

const BROWSER_COMMANDS = [
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
  "microsoft-edge",
];

export function findBrowser(): string | null {
  const fromEnvironment = process.env.CHROME_PATH;

  if (fromEnvironment && existsSync(fromEnvironment)) return fromEnvironment;

  const installed = BROWSER_PATHS.find((path) => existsSync(path));

  if (installed) return installed;

  return BROWSER_COMMANDS.map((command) => Bun.which(command)).find((path) => path !== null) ?? null;
}

export async function writePdf({
  browser,
  html,
  outDir,
  pdfPath,
}: {
  browser: string;
  html: string;
  outDir: string;
  pdfPath: string;
}): Promise<void> {
  const printPage = join(outDir, ".report-print.html");

  writeFileSync(printPage, html);
  rmSync(pdfPath, { force: true });

  try {
    const child = Bun.spawn(
      [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-pdf-header-footer",
        `--virtual-time-budget=${FONT_LOAD_BUDGET_MS}`,
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(printPage).href,
      ],
      { stdout: "pipe", stderr: "pipe", timeout: PDF_TIMEOUT_MS }
    );
    const [stderr, exitCode] = await Promise.all([new Response(child.stderr).text(), child.exited]);

    if (exitCode !== 0 || !existsSync(pdfPath) || statSync(pdfPath).size === 0) {
      throw new Error(`PDF export failed (exit ${exitCode}): ${stderr.trim().split("\n").slice(-5).join("\n")}`);
    }
  } finally {
    rmSync(printPage, { force: true });
  }
}
