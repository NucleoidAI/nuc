import type { EntryType, Question, Questions } from "@typesafe-ai/sdk";
import { ask, choice, noul } from "../../lib/decision";
import type { LLMMeta } from "../../lib/llmLog";
import platform from "@canmingir/link-express";

const NONE = "none";
const INPUTS_AVAILABLE = "inputs_available";
const PLATFORM_FIELDS = new Set([
  "sessionId",
  "agentId",
  "taskId",
  "blueprintId",
]);
const MAX_CANDIDATES = 200;
const MAX_LEAVES_PER_SOURCE = 40;
const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 5;
const MAX_VALUE_LENGTH = 160;
const REF_MIN_PROBABILITY = 0.5;
const BOOLEAN_TRUE_THRESHOLD = 0.7;
const BOOLEAN_FALSE_THRESHOLD = 0.3;

type Definition = {
  action: string;
  label?: string;
  description?: string;
  inputSchema?: {
    properties?: Record<string, SchemaProperty>;
    required?: string[];
  };
};

type SchemaProperty = {
  type?: string;
  description?: string;
  enum?: unknown[];
};

type StepLike = {
  action?: string;
  parameters?: unknown;
  result?: unknown;
};

type Candidate = {
  path: string;
  value: string;
  action?: string;
};

function json(value: unknown): EntryType {
  return JSON.parse(JSON.stringify(value ?? null));
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function leaves(value: unknown, path: string, depth: number, out: Candidate[]) {
  if (out.length >= MAX_LEAVES_PER_SOURCE || value == null) return;

  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    if (depth >= MAX_DEPTH) return;
    parsed
      .slice(0, MAX_ARRAY_ITEMS)
      .forEach((item, index) =>
        leaves(item, `${path}[${index}]`, depth + 1, out),
      );
    return;
  }

  if (typeof parsed === "object") {
    if (depth >= MAX_DEPTH) return;
    for (const [key, item] of Object.entries(parsed as object)) {
      if (/[.[\]]/.test(key)) continue;
      leaves(item, `${path}.${key}`, depth + 1, out);
    }
    return;
  }

  out.push({ path, value: String(parsed).slice(0, MAX_VALUE_LENGTH) });
}

function refCandidates({
  steps,
  inheritedSteps,
  variables,
}: {
  steps: StepLike[];
  inheritedSteps: StepLike[];
  variables: Record<string, unknown>;
}) {
  const candidates: Candidate[] = [];

  leaves(variables, "session_variables", 0, candidates);

  const collect = (source: StepLike[], prefix: string) =>
    source.forEach((step, index) => {
      for (const field of ["result", "parameters"] as const) {
        const found: Candidate[] = [];
        leaves(step[field], `${prefix}[${index}].${field}`, 0, found);
        candidates.push(
          ...found.map((candidate) => ({ ...candidate, action: step.action })),
        );
      }
    });

  collect(steps, "steps");
  collect(inheritedSteps, "inherited_steps");

  return candidates.slice(0, MAX_CANDIDATES);
}

const LOG_LIST_LIMIT = 2;
const LOG_FULL_KEYS = new Set(["blueprint"]);

function previewList(value: unknown): unknown {
  if (Array.isArray(value)) {
    const shown = value.slice(0, LOG_LIST_LIMIT).map(previewList);

    return value.length > LOG_LIST_LIMIT
      ? [...shown, `... ${value.length - LOG_LIST_LIMIT} more`]
      : shown;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        LOG_FULL_KEYS.has(key) ? item : previewList(item),
      ]),
    );
  }

  return value;
}

function previewQuestions(questions: Questions) {
  return Object.fromEntries(
    Object.entries(questions).map(([id, question]) => {
      if (question.type !== "choice") return [id, question];

      const entries = Object.entries(question.criteria);

      return [
        id,
        {
          ...question,
          criteria: Object.fromEntries(entries.slice(0, LOG_LIST_LIMIT)),
          ...(entries.length > LOG_LIST_LIMIT && {
            omitted_criteria: entries.length - LOG_LIST_LIMIT,
          }),
        },
      ];
    }),
  );
}

function previewAnswers(answers: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(answers).map(([id, answer]) => {
      const { probabilities } = (answer ?? {}) as {
        probabilities?: Record<string, number>;
      };

      if (!probabilities) return [id, answer];

      return [
        id,
        {
          ...(answer as object),
          probabilities: Object.fromEntries(
            Object.entries(probabilities)
              .filter(([, probability]) => probability > 0)
              .sort(([, a], [, b]) => b - a),
          ),
        },
      ];
    }),
  );
}

async function askJev<const Q extends Questions>(
  source: string,
  { state, questions, meta }: { state: object; questions: Q; meta: LLMMeta },
) {
  const request = { state: json(state), questions };

  console.debug(
    `[jev] ${source} request:`,
    JSON.stringify(
      {
        state: previewList(request.state),
        questions: previewQuestions(questions),
      },
      null,
      2,
    ),
  );

  const answers = await ask({
    ...request,
    meta: { ...meta, source: `agent.${source}` },
  });

  console.debug(
    `[jev] ${source} answers:`,
    JSON.stringify(previewAnswers(answers), null, 2),
  );

  return answers;
}

async function selectNextAction({
  state,
  options,
  meta,
}: {
  state: object;
  options: Definition[];
  meta: LLMMeta;
}) {
  const { next_action } = await askJev("selectNextAction", {
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

  return {
    action: next_action.choice,
    confidence: next_action.confidence,
    probabilities: next_action.probabilities as Record<string, number>,
  };
}

async function judgeParameters({
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
}): Promise<{ filled: Record<string, unknown>; inputsAvailable?: number }> {
  const properties = definition?.inputSchema?.properties ?? {};
  const required = new Set(definition?.inputSchema?.required ?? []);
  const candidates = refCandidates({ steps, inheritedSteps, variables });

  const fields = Object.entries(properties).filter(
    ([field]) => !PLATFORM_FIELDS.has(field) && !skipFields.includes(field),
  );

  const questions: Record<string, Question> = {};
  const plan: Record<
    string,
    { field: string; kind: "enum" | "boolean" | "ref"; values?: unknown[] }
  > = {};

  fields.forEach(([field, schema], index) => {
    const parameter = {
      name: field,
      type: schema.type ?? null,
      description: schema.description ?? null,
      required: required.has(field),
    };
    const id = `field_${index}`;

    if (Array.isArray(schema.enum) && schema.enum.length) {
      questions[id] = choice(
        { select: "parameter_value", action, parameter },
        {
          ...Object.fromEntries(
            schema.enum.map((value) => [String(value), { value }]),
          ),
          ...(!required.has(field) && { [NONE]: { value: null } }),
        },
      );
      plan[id] = { field, kind: "enum", values: schema.enum };
      return;
    }

    if (schema.type === "boolean") {
      questions[id] = noul(
        { decide: "parameter_is_true", action, parameter },
        { true: { value: true }, false: { value: false } },
      );
      plan[id] = { field, kind: "boolean" };
      return;
    }

    if (!candidates.length) return;

    questions[id] = choice(
      {
        select: "parameter_source",
        action,
        parameter,
        sources: [
          "`session_variables`",
          "`steps`",
          "`inherited_context_steps`",
        ],
      },
      {
        [NONE]: { source: null },
        ...Object.fromEntries(
          candidates.map(({ path, value, action: from }) => [
            path,
            { value, from_action: from ?? null },
          ]),
        ),
      },
    );
    plan[id] = { field, kind: "ref" };
  });

  const requiredFields = fields.filter(([field]) => required.has(field));

  if (requiredFields.length) {
    questions[INPUTS_AVAILABLE] = noul(
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
      },
      { true: { inputs: "available" }, false: { inputs: "missing" } },
    );
  }

  if (!Object.keys(questions).length) return { filled: {} };

  try {
    const answers = await askJev("judgeParameters", {
      state,
      questions,
      meta,
    });

    const filled: Record<string, unknown> = {};
    const inputs = answers[INPUTS_AVAILABLE];
    const inputsAvailable = inputs?.type === "noul" ? inputs.noul : undefined;

    for (const [id, { field, kind, values }] of Object.entries(plan)) {
      const answer = answers[id];

      if (kind === "boolean" && answer?.type === "noul") {
        if (answer.noul >= BOOLEAN_TRUE_THRESHOLD) filled[field] = true;
        else if (answer.noul <= BOOLEAN_FALSE_THRESHOLD) filled[field] = false;
      }

      if (
        kind === "enum" &&
        answer?.type === "choice" &&
        answer.choice !== NONE
      ) {
        filled[field] =
          values?.find((value) => String(value) === answer.choice) ??
          answer.choice;
      }

      if (
        kind === "ref" &&
        answer?.type === "choice" &&
        answer.choice !== NONE &&
        answer.probabilities[answer.choice] >= REF_MIN_PROBABILITY
      ) {
        filled[field] = { $ref: answer.choice };
      }
    }

    console.debug(
      `[jev] judgeParameters filled ${action}:`,
      JSON.stringify(filled, null, 2),
    );

    return { filled, inputsAvailable };
  } catch (error) {
    platform.logger.error(error);

    return { filled: {} };
  }
}

export type { Definition };
export { judgeParameters, selectNextAction };
