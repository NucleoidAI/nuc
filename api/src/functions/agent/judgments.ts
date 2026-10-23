import type {
  EntryType,
  JsonValue,
  Question,
  Questions,
} from "@typesafe-ai/sdk";
import { ask, choice, noul } from "../../lib/decision";
import fewShots from "../../dataset/train/decision/index";
import type { LLMMeta } from "@canmingir/link-express/llm";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const PLATFORM_FIELDS = new Set([
  "sessionId",
  "agentId",
  "taskId",
  "blueprintId",
]);

const NOISE_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "created",
  "livemode",
  "object",
  "agentId",
  "teamId",
  "organizationId",
  "sessionId",
  "taskId",
  "blueprintId",
]);

const TEXT_ONLY_ACTIONS = new Set(["PLATFORM:knowledge_lookup"]);

type Definition = {
  action: string;
  label?: string;
  description?: string;
  inputSchema?: {
    properties?: Record<
      string,
      {
        type?: string;
        description?: string;
        enum?: unknown[];
        generated?: boolean;
      }
    >;
    required?: string[];
  };
};

type Parameter = {
  name: string;
  type: string | null;
  description: string | null;
  required: boolean;
};

type StepLike = {
  action?: string;
  status?: string;
  parameters?: unknown;
  result?: unknown;
};

type Candidate = {
  path: string;
  value: string;
  key: string;
  kind: string;
  text: string;
  prose?: boolean;
  action?: string;
};

type Answer =
  | { type: "choice"; choice: string; probabilities: Record<string, number> }
  | { type: "noul"; noul: number };

function collectCandidates({
  steps,
  inheritedSteps,
  variables,
}: {
  steps: StepLike[];
  inheritedSteps: StepLike[];
  variables: Record<string, unknown>;
}) {
  const walk = (
    value: unknown,
    path: string,
    depth: number,
    out: Candidate[],
  ) => {
    if (out.length >= 40 || value == null || value === "") return;

    let parsed = value;
    if (typeof value === "string" && /^\s*[{[]/.test(value)) {
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = value;
      }
    }

    if (typeof parsed === "object" && parsed !== null) {
      if (depth >= 4 || "$ref" in parsed) return;

      if (depth > 0 || /\.result$/.test(path)) {
        const text = JSON.stringify(parsed);
        const kind = Array.isArray(parsed) ? "array" : "object";
        out.push({
          path,
          value: text.slice(0, 160),
          key: `${kind}:${text}`,
          kind,
          text,
        });
      }

      const children = Array.isArray(parsed)
        ? parsed.slice(0, 5).map((item, index) => [`[${index}]`, item])
        : Object.entries(parsed)
            .filter(([key]) => !/[.[\]]/.test(key) && !NOISE_KEYS.has(key))
            .map(([key, item]) => [`.${key}`, item]);

      for (const [suffix, item] of children) {
        walk(item, `${path}${suffix}`, depth + 1, out);
      }
      return;
    }

    const text = String(parsed);
    out.push({
      path,
      value: text.slice(0, 160),
      key: `${typeof parsed}:${text}`,
      kind: typeof parsed,
      text,
    });
  };

  const candidates: Candidate[] = [];
  walk(variables, "session_variables", 0, candidates);

  for (const [prefix, source] of [
    ["inherited_steps", inheritedSteps],
    ["steps", steps],
  ] as const) {
    source.forEach((step, index) => {
      if (step.status === "FAILED") return;

      const textOnly = TEXT_ONLY_ACTIONS.has(step.action ?? "");

      for (const field of ["result", "parameters"] as const) {
        const found: Candidate[] = [];
        walk(step[field], `${prefix}[${index}].${field}`, 0, found);

        for (const candidate of found) {
          if (textOnly && !/\.text(\.|$)/.test(candidate.path)) continue;

          candidates.push({
            ...candidate,
            action: step.action,
            prose:
              textOnly &&
              candidate.kind === "string" &&
              /\.text$/.test(candidate.path),
          });
        }
      }
    });
  }

  const isParameter = (path: string) =>
    /^(inherited_steps|steps)\[\d+\]\.parameters\./.test(path);
  const seen = new Set(
    candidates.filter(({ path }) => !isParameter(path)).map(({ key }) => key),
  );

  return candidates
    .filter(({ path, key }) => {
      if (!isParameter(path)) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(-200);
}

function withFewShots(list: object[]): { few_shots: JsonValue[] } | {} {
  return list.length ? { few_shots: list as JsonValue[] } : {};
}

function parameterDiamondFewShots(action: string, name: string) {
  return fewShots.parameterDiamond.filter(
    (fewShot) => fewShot.action === action && fewShot.parameter.name === name,
  );
}

function inputsAvailableFewShots(action: string) {
  return fewShots.inputsAvailable.filter(
    (fewShot) => fewShot.action === action,
  );
}

function topChoices(probabilities: Record<string, number>) {
  return Object.entries(probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([key, probability]) => `${key} ${probability.toFixed(2)}`)
    .join(", ");
}

async function askJev<const Q extends Questions>(
  source: string,
  { state, questions, meta }: { state: object; questions: Q; meta: LLMMeta },
) {
  const request = {
    state: JSON.parse(JSON.stringify(state)) as EntryType,
    questions,
  };

  const startedAt = Date.now();
  const dump = (outcome: { response: unknown } | { error: string }) => {
    const dir = process.env.JEV_DUMP_DIR;
    if (!dir) return;
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(
          dir,
          `${startedAt}-${source}-${Object.keys(questions).join("_")}.json`,
        ),
        JSON.stringify(
          {
            runId: meta.taskId ?? meta.sessionId ?? null,
            meta,
            source,
            startedAt,
            durationMs: Date.now() - startedAt,
            ...request,
            ...outcome,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(`[jev] dump failed: ${String(error)}`);
    }
  };

  try {
    const response = await ask({
      ...request,
      meta: { ...meta, source: `agent.${source}` },
    });
    dump({ response });
    return response;
  } catch (error) {
    dump({ error: String(error) });
    console.error(
      `[jev] ${source} failed (${JSON.stringify(request).length} bytes):`,
      error,
    );
    throw error;
  }
}

async function actionDiamond({
  state,
  options,
  meta,
}: {
  state: object;
  options: Definition[];
  meta: LLMMeta;
}) {
  const { next_action } = await askJev("actionDiamond", {
    state,
    questions: {
      next_action: choice(
        {
          select: "next_action",
          workflow: "`blueprint`",
          ...("current_node" in state && {
            current_position: "`current_node`",
          }),
          executed_steps: "`steps`",
          context: [
            "`session_variables`",
            "`knowledge_base`",
            "`inherited_context_steps`",
            "`conversation`",
          ],
          ...withFewShots(fewShots.actionDiamond),
        },
        Object.fromEntries(
          options.map(({ action, label, description, inputSchema }) => [
            action,
            {
              label: label ?? null,
              description: description ?? null,
              parameters: Object.keys(inputSchema?.properties ?? {}),
            },
          ]),
        ),
      ),
    },
    meta,
  });

  const probabilities = next_action.probabilities as Record<string, number>;

  console.debug(
    `[jev] selected ${
      next_action.choice
    } confidence=${next_action.confidence.toFixed(4)}  | ${topChoices(
      probabilities,
    )}`,
  );

  return {
    action: next_action.choice,
    confidence: next_action.confidence,
    probabilities,
  };
}

async function extractKnowledge({
  text,
  parameter,
  action,
  meta,
}: {
  text: string;
  parameter: Parameter;
  action?: string;
  meta: LLMMeta;
}): Promise<{ value: string | number; probability: number } | undefined> {
  const numeric = parameter.type === "number" || parameter.type === "integer";
  const words = text.split(/\s+/).filter(Boolean);
  const options = new Map<string, string | number>();

  for (let size = 1; size <= 5; size++) {
    for (
      let start = 0;
      start + size <= words.length && options.size < 250;
      start++
    ) {
      const span = words
        .slice(start, start + size)
        .join(" ")
        .replace(/^[\s"'`“”‘’([{<,;:.!?]+|[\s"'`“”‘’)\]}>,;:.!?]+$/g, "");
      if (!span) continue;

      const value = numeric ? Number(span.replace(/,/g, "")) : span;
      if (typeof value === "number" && !Number.isFinite(value)) continue;
      if (parameter.type === "integer" && !Number.isInteger(value)) continue;

      options.set(span, value);
    }
  }

  if (!options.size) return undefined;

  try {
    const { knowledge_value: value } = await askJev("extractKnowledge", {
      state: { text },
      questions: {
        knowledge_value: choice(
          {
            select: "knowledge_value",
            action: action ?? null,
            parameter,
            source: "`text`",
            rule: "pick the exact span of `text` that is the value of the parameter",
          },
          {
            none: { value: null, meaning: "`text` does not contain it" },
            ...Object.fromEntries(
              [...options].map(([span, value]) => [span, { value }]),
            ),
          },
        ),
      },
      meta,
    });

    const probabilities = value.probabilities as Record<string, number>;
    const probability = probabilities[value.choice] ?? 0;

    console.debug(
      `[jev] extract ${action ?? ""} ${parameter.name}  ${topChoices(
        probabilities,
      )}`,
    );

    if (value.choice === "none" || probability < 0.5) return undefined;

    return { value: options.get(value.choice)!, probability };
  } catch {
    return undefined;
  }
}

function bestCandidate(
  answer: Answer | undefined,
  byPath: Map<string, Candidate>,
) {
  if (answer?.type !== "choice") return undefined;

  const top = byPath.get(answer.choice);
  if (top?.prose) return top;

  const ranked = Object.entries(answer.probabilities)
    .filter(([path]) => byPath.has(path))
    .sort(([, a], [, b]) => b - a);

  const totals = new Map<string, number>();
  for (const [path, probability] of ranked) {
    const { key } = byPath.get(path)!;
    totals.set(key, (totals.get(key) ?? 0) + probability);
  }

  const [key, total = 0] = [...totals].sort(([, a], [, b]) => b - a)[0] ?? [];
  if (total < 0.5) return undefined;

  const [path] = ranked.find(([path]) => byPath.get(path)!.key === key)!;
  return byPath.get(path);
}

async function parameterDiamond({
  action,
  definition,
  skipFields,
  state,
  steps,
  inheritedSteps,
  variables,
  meta,
}: {
  action: string;
  definition?: Definition;
  skipFields: string[];
  state: object;
  steps: StepLike[];
  inheritedSteps: StepLike[];
  variables: Record<string, unknown>;
  meta: LLMMeta;
}): Promise<{
  filled: Record<string, unknown>;
  generate: string[];
  inputsAvailable?: number;
}> {
  const properties = definition?.inputSchema?.properties ?? {};
  const required = new Set(definition?.inputSchema?.required ?? []);
  const candidates = collectCandidates({ steps, inheritedSteps, variables });
  const byPath = new Map(
    candidates.map((candidate) => [candidate.path, candidate]),
  );

  const owned = Object.entries(properties).filter(
    ([field]) => !PLATFORM_FIELDS.has(field) && !skipFields.includes(field),
  );
  const fields = owned.filter(([, schema]) => !schema.generated);
  const generate = owned
    .filter(([, schema]) => schema.generated)
    .map(([field]) => field);

  const plan: Record<
    string,
    {
      field: string;
      kind: "enum" | "boolean" | "ref";
      parameter: Parameter;
      values?: unknown[];
    }
  > = {};
  const shared: Record<string, Question> = {};
  const batches: Record<string, Question>[] = [];

  fields.forEach(([field, schema]) => {
    const parameter: Parameter = {
      name: field,
      type: schema.type ?? null,
      description: schema.description ?? null,
      required: required.has(field),
    };

    if (schema.enum?.length) {
      const id = `value_${field}`;
      shared[id] = choice(
        {
          select: "parameter_value",
          action,
          parameter,
          ...withFewShots(parameterDiamondFewShots(action, field)),
        },
        {
          ...Object.fromEntries(
            schema.enum.map((value) => [String(value), { value }]),
          ),
          ...(!parameter.required && { none: { value: null } }),
        },
      );
      plan[id] = { field, kind: "enum", parameter, values: schema.enum };
      return;
    }

    if (schema.type === "boolean") {
      const id = `value_${field}`;
      shared[id] = noul(
        {
          decide: "parameter_is_true",
          action,
          parameter,
          ...withFewShots(parameterDiamondFewShots(action, field)),
        },
        { true: { value: true }, false: { value: false } },
      );
      plan[id] = { field, kind: "boolean", parameter };
      return;
    }

    const accepted = candidates.filter(({ kind, value }) => {
      if (schema.type === "object" || schema.type === "array")
        return kind === schema.type;
      if (schema.type === "integer")
        return kind === "number" && Number.isInteger(Number(value));
      if (schema.type === "number") return kind === "number";
      if (schema.type === "string")
        return kind === "string" || kind === "number";
      return kind !== "object" && kind !== "array";
    });

    const id = `source_${field}`;
    batches.push({
      [id]: choice(
        {
          select: "parameter_source",
          action,
          parameter,
          sources: [
            "`session_variables`",
            "`steps`",
            "`inherited_context_steps`",
          ],
          ...withFewShots(parameterDiamondFewShots(action, field)),
        },
        {
          none: { source: null },
          generate: {
            source: "compose",
            value:
              "new value written from `conversation`, `knowledge_base` and `steps`",
          },
          ...Object.fromEntries(
            accepted.map(({ path, value, action: from }) => [
              path,
              { value, from_action: from ?? null },
            ]),
          ),
        },
      ),
    });
    plan[id] = { field, kind: "ref", parameter };
  });

  const requiredFields = fields.filter(([field]) => required.has(field));

  if (requiredFields.length) {
    shared.inputs_available = noul(
      {
        decide: "inputs_available",
        action,
        required_parameters: requiredFields.map(([field, schema]) => ({
          name: field,
          type: schema.type ?? null,
          description: schema.description ?? null,
        })),
        evidence: [
          "`session_variables`",
          "`steps`",
          "`knowledge_base`",
          "`inherited_context_steps`",
          "`conversation`",
        ],
        ...withFewShots(inputsAvailableFewShots(action)),
      },
      { true: { inputs: "available" }, false: { inputs: "missing" } },
    );
  }

  if (Object.keys(shared).length) batches.unshift(shared);
  if (!batches.length) return { filled: {}, generate };

  const answers: Record<string, Answer | undefined> = {};
  const queue = [...batches];

  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      for (let batch = queue.shift(); batch; batch = queue.shift()) {
        Object.assign(
          answers,
          await askJev("parameterDiamond", {
            state,
            questions: batch,
            meta,
          }).catch(() => ({})),
        );
      }
    }),
  );

  const filled: Record<string, unknown> = {};
  const extractions: Promise<void>[] = [];
  const inputs = answers.inputs_available;
  const inputsAvailable = inputs?.type === "noul" ? inputs.noul : undefined;

  for (const [id, { field, kind, parameter, values }] of Object.entries(plan)) {
    const answer = answers[id];

    console.debug(
      `[jev] ${action}.${field}  ${
        answer?.type === "noul"
          ? `noul ${answer.noul.toFixed(2)}`
          : answer?.type === "choice"
          ? topChoices(answer.probabilities)
          : "no answer"
      }`,
    );

    if (kind === "boolean") {
      if (answer?.type === "noul" && answer.noul >= 0.7) filled[field] = true;
      else if (answer?.type === "noul" && answer.noul <= 0.3)
        filled[field] = false;
      else generate.push(field);
    }

    if (kind === "enum") {
      if (answer?.type !== "choice") generate.push(field);
      else if (answer.choice !== "none") {
        filled[field] =
          values?.find((value) => String(value) === answer.choice) ??
          answer.choice;
      }
    }

    if (kind === "ref") {
      const candidate = bestCandidate(answer, byPath);

      if (candidate?.prose) {
        extractions.push(
          extractKnowledge({
            text: candidate.text,
            parameter,
            action,
            meta,
          }).then((extracted) => {
            if (extracted) filled[field] = extracted.value;
            else generate.push(field);
          }),
        );
      } else if (candidate) {
        filled[field] = { $ref: candidate.path };
      } else if (
        answer?.type !== "choice" ||
        answer.choice !== "none" ||
        parameter.required
      ) {
        generate.push(field);
      }
    }
  }

  await Promise.all(extractions);

  console.debug(`[jev] params ${action}`, {
    filled,
    generate,
    inputsAvailable,
  });

  return { filled, generate, inputsAvailable };
}

export type { Definition };
export { actionDiamond, extractKnowledge, parameterDiamond };
