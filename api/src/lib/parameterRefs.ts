const REF_KEY = "$ref";

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Step results are stored as plain strings (often JSON-stringified by the action
// that produced them), so a deeper path segment needs to parse through that string
// rather than index into it as raw text.
function getByPath(source: unknown, path: string): unknown {
  const parts = path
    .split(".")
    .flatMap((segment) => segment.split(/\[(\d+)\]/).filter((s) => s !== ""));

  let current: unknown = source;
  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current === "string") {
      current = tryParseJson(current) ?? current;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function isRefNode(value: unknown): value is { [REF_KEY]: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof (value as Record<string, unknown>)[REF_KEY] === "string"
  );
}

// Some models (observed with Bedrock/Llama) emit the ref object JSON-encoded as a
// string value instead of a nested object, e.g. `"{ \"$ref\": \"steps[0].result\" }"`.
function parseRefString(value: string): { [REF_KEY]: string } | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.includes(REF_KEY)) return undefined;
  const parsed = tryParseJson(trimmed);
  return isRefNode(parsed) ? parsed : undefined;
}

// Throws on an unresolvable $ref instead of passing it through, so a bad reference
// fails the task loudly rather than reaching an action call as garbage input.
function resolveParameterRefs<T>(value: T, source: Record<string, unknown>): T {
  if (Array.isArray(value)) {
    return value.map((item) =>
      resolveParameterRefs(item, source)
    ) as unknown as T;
  }

  const refNode =
    typeof value === "string"
      ? parseRefString(value)
      : isRefNode(value)
      ? value
      : undefined;

  if (refNode) {
    const path = refNode[REF_KEY];
    const resolved = getByPath(source, path);
    if (resolved === undefined) {
      throw new Error(
        `Unable to resolve parameter reference "$ref: ${path}" against task context`
      );
    }
    return resolveParameterRefs(resolved as T, source);
  }

  if (typeof value === "string") {
    return value;
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = resolveParameterRefs(val, source);
    }
    return result as T;
  }

  return value;
}

export { resolveParameterRefs, getByPath };
