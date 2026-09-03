/**
 * Bedrock's Converse tool-use path is given a generic `{ type: "object" }`
 * schema, and for multi-field formats the model sometimes nests the whole
 * object under a single wrapper key (e.g. `{ response: { ... } }`) instead of
 * returning it flat. This unwraps that nesting so callers see the fields they
 * asked for, whichever shape came back.
 */
function unwrapResult(
  result: unknown,
  expectedKeys: string[],
): Record<string, unknown> {
  let current = result;

  for (let depth = 0; depth < 3; depth++) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return {};
    }

    const record = current as Record<string, unknown>;

    if (expectedKeys.some((key) => key in record)) {
      return record;
    }

    const values = Object.values(record);
    if (values.length === 1 && values[0] && typeof values[0] === "object") {
      current = values[0];
      continue;
    }

    return record;
  }

  return {};
}

export { unwrapResult };
