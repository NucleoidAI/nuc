import { readFileSync } from "node:fs";

export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export type Region = {
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
};

export type CodeLocation = {
  file: string;
  region: Region;
  message: string | null;
};

export type MessagePart = {
  text: string;
  reference: CodeLocation | null;
};

export type Finding = {
  ruleId: string;
  title: string;
  description: string | null;
  level: string;
  severity: Severity;
  score: number | null;
  precision: string | null;
  cwes: number[];
  message: MessagePart[];
  location: CodeLocation;
  flow: CodeLocation[];
  extraPaths: number;
};

export type Report = {
  tool: string;
  version: string | null;
  findings: Finding[];
  filesScanned: number | null;
  linesOfCode: number | null;
};

type SarifLocation = {
  id?: number;
  physicalLocation?: {
    artifactLocation?: { uri?: string };
    region?: Region;
  };
  message?: { text?: string };
};

type SarifCodeFlow = {
  threadFlows?: { locations?: { location?: SarifLocation }[] }[];
};

type SarifResult = {
  ruleId: string;
  ruleIndex?: number;
  level?: string;
  message: { text: string };
  locations?: SarifLocation[];
  relatedLocations?: SarifLocation[];
  codeFlows?: SarifCodeFlow[];
};

type SarifRule = {
  id: string;
  shortDescription?: { text?: string };
  fullDescription?: { text?: string };
  defaultConfiguration?: { level?: string };
  properties?: {
    tags?: string[];
    precision?: string;
    "security-severity"?: string;
  };
};

type SarifRun = {
  tool: {
    driver: { name: string; semanticVersion?: string; rules?: SarifRule[] };
  };
  results?: SarifResult[];
  invocations?: {
    toolExecutionNotifications?: {
      descriptor?: { id?: string };
      locations?: SarifLocation[];
    }[];
  }[];
  properties?: { metricResults?: { ruleId: string; value: number }[] };
};

type SarifLog = { runs?: SarifRun[] };

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CWE_TAG_PREFIX = "external/cwe/cwe-";
const REFERENCE_PATTERN = /\[([^\]]+)\]\((\d+)\)/g;

export function loadReport(sarifPath: string): Report {
  const log = parseSarif(sarifPath);
  const runs = log.runs ?? [];

  if (runs.length === 0) {
    throw new Error(`${sarifPath} contains no CodeQL runs`);
  }

  const findings = runs.flatMap(findingsOf);

  return {
    tool: runs[0].tool.driver.name,
    version: runs[0].tool.driver.semanticVersion ?? null,
    findings: [...findings].sort(compareFindings),
    filesScanned: countScannedFiles(runs),
    linesOfCode: countLinesOfCode(runs),
  };
}

function parseSarif(sarifPath: string): SarifLog {
  const text = readFileSync(sarifPath, "utf8");

  try {
    return JSON.parse(text) as SarifLog;
  } catch (error: unknown) {
    throw new Error(`${sarifPath} is not valid SARIF JSON`, { cause: error });
  }
}

function findingsOf(run: SarifRun): Finding[] {
  const rules = run.tool.driver.rules ?? [];

  return (run.results ?? []).flatMap((result) => {
    const location = toCodeLocation(result.locations?.[0]);

    if (!location) return [];

    const rule =
      rules.find((candidate) => candidate.id === result.ruleId) ??
      (result.ruleIndex === undefined ? undefined : rules[result.ruleIndex]);

    return [toFinding({ result, rule, location })];
  });
}

function toFinding({
  result,
  rule,
  location,
}: {
  result: SarifResult;
  rule: SarifRule | undefined;
  location: CodeLocation;
}): Finding {
  const level = result.level ?? rule?.defaultConfiguration?.level ?? "warning";
  const score = scoreOf(rule);
  const codeFlows = result.codeFlows ?? [];

  return {
    ruleId: result.ruleId,
    title: rule?.shortDescription?.text ?? result.ruleId,
    description: rule?.fullDescription?.text ?? null,
    level,
    severity: score === null ? severityFromLevel(level) : severityFromScore(score),
    score,
    precision: rule?.properties?.precision ?? null,
    cwes: cwesOf(rule),
    message: messagePartsOf(result),
    location,
    flow: flowOf(codeFlows[0]),
    extraPaths: Math.max(codeFlows.length - 1, 0),
  };
}

function toCodeLocation(location: SarifLocation | undefined): CodeLocation | null {
  const uri = location?.physicalLocation?.artifactLocation?.uri;

  if (!uri) return null;

  return {
    file: decodeURIComponent(uri),
    region: location.physicalLocation?.region ?? { startLine: 1 },
    message: location.message?.text ?? null,
  };
}

function scoreOf(rule: SarifRule | undefined): number | null {
  const raw = rule?.properties?.["security-severity"];

  if (raw === undefined) return null;

  const score = Number.parseFloat(raw);

  return Number.isNaN(score) ? null : score;
}

function severityFromScore(score: number): Severity {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function severityFromLevel(level: string): Severity {
  if (level === "error") return "high";
  if (level === "warning") return "medium";
  return "low";
}

function cwesOf(rule: SarifRule | undefined): number[] {
  return (rule?.properties?.tags ?? [])
    .filter((tag) => tag.startsWith(CWE_TAG_PREFIX))
    .map((tag) => Number.parseInt(tag.slice(CWE_TAG_PREFIX.length), 10))
    .filter((cwe) => !Number.isNaN(cwe));
}

function messagePartsOf(result: SarifResult): MessagePart[] {
  const references = new Map(
    (result.relatedLocations ?? []).flatMap((related) =>
      related.id === undefined ? [] : [[related.id, toCodeLocation(related)] as const]
    )
  );
  const text = result.message.text;
  const parts: MessagePart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    parts.push({ text: text.slice(cursor, match.index), reference: null });
    parts.push({
      text: match[1],
      reference: references.get(Number.parseInt(match[2], 10)) ?? null,
    });
    cursor = match.index + match[0].length;
  }

  parts.push({ text: text.slice(cursor), reference: null });

  return parts.filter((part) => part.text.length > 0);
}

function flowOf(codeFlow: SarifCodeFlow | undefined): CodeLocation[] {
  const steps = (codeFlow?.threadFlows?.[0]?.locations ?? []).flatMap((step) => {
    const location = toCodeLocation(step.location);
    return location ? [location] : [];
  });

  return steps.filter(
    (step, index) => index === 0 || locationKey(step) !== locationKey(steps[index - 1])
  );
}

function locationKey(location: CodeLocation): string {
  const { startLine, startColumn, endLine, endColumn } = location.region;
  return `${location.file}:${startLine}:${startColumn}:${endLine}:${endColumn}`;
}

function compareFindings(left: Finding, right: Finding): number {
  const bySeverity = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];

  if (bySeverity !== 0) return bySeverity;

  const byScore = (right.score ?? 0) - (left.score ?? 0);

  if (byScore !== 0) return byScore;

  return locationKey(left.location).localeCompare(locationKey(right.location));
}

function countScannedFiles(runs: SarifRun[]): number | null {
  const files = new Set(
    runs.flatMap((run) =>
      (run.invocations ?? []).flatMap((invocation) =>
        (invocation.toolExecutionNotifications ?? [])
          .filter((notification) =>
            notification.descriptor?.id?.endsWith("/successfully-extracted-files")
          )
          .flatMap((notification) =>
            (notification.locations ?? []).flatMap((location) => {
              const uri = location.physicalLocation?.artifactLocation?.uri;
              return uri ? [uri] : [];
            })
          )
      )
    )
  );

  return files.size === 0 ? null : files.size;
}

function countLinesOfCode(runs: SarifRun[]): number | null {
  const metrics = runs.flatMap((run) => run.properties?.metricResults ?? []);
  const userCode = metrics.filter((metric) =>
    metric.ruleId.endsWith("/summary/lines-of-user-code")
  );

  if (userCode.length === 0) return null;

  return userCode.reduce((total, metric) => total + metric.value, 0);
}
