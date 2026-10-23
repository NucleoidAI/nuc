import fs from "fs";
import path from "path";

const DATASETS = [
  "decision-action-diamond",
  "decision-customer-approval",
  "decision-inputs-available",
  "decision-parameter-diamond",
  "decision-supervising-chat-decision",
  "decision-supervising-chat-sufficiency",
  "llm-approval",
  "llm-approval-question",
  "llm-blueprint-chat",
  "llm-blueprint-chat-decision",
  "llm-blueprint-chat-knowledge",
  "llm-blueprint-chat-sufficiency",
  "llm-blueprint-description",
  "llm-blueprint-name",
  "llm-blueprint-skill",
  "llm-decision",
  "llm-force-task-diamond-blocking",
  "llm-force-task-diamond-non-blocking",
  "llm-knowledge-score",
  "llm-policy",
  "llm-supervising-knowledge-chat",
  "llm-switch",
  "llm-task-diamond-blocking",
  "llm-task-diamond-non-blocking",
  "llm-team-chat",
] as const;

type Dataset = (typeof DATASETS)[number];

type DatasetRef = {
  $dataset: Dataset;
  where?: Record<string, string>;
};

type Source<T> = T[] | DatasetRef;

function file(name: Dataset): string {
  const [group, ...rest] = name.split("-");
  return path.join(__dirname, group, `${rest.join("-")}.json`);
}

function isRef<T>(source: Source<T>): source is DatasetRef {
  return !Array.isArray(source);
}

function load(name: Dataset): Source<unknown> {
  const location = file(name);

  if (!fs.existsSync(location)) {
    return { $dataset: name };
  }

  return JSON.parse(fs.readFileSync(location, "utf8")).data;
}

function pick(value: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (current, part) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined,
      value,
    );
}

function select<T>(
  source: Source<T>,
  where: Record<string, string>,
): Source<T> {
  if (isRef(source)) {
    return { ...source, where: { ...source.where, ...where } };
  }

  return source.filter((item) =>
    Object.entries(where).every(([key, value]) => pick(item, key) === value),
  );
}

export type { Dataset, DatasetRef, Source };
export { DATASETS, file, isRef, load, select };
