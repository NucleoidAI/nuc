function replaceInText(text: string, replacements: [string, string][]): string {
  return replacements.reduce((acc, [id, name]) => acc.split(id).join(name), text);
}

function deepResolve(
  value: unknown,
  replacements: [string, string][]
): unknown {
  if (typeof value === "string") {
    return replaceInText(value, replacements);
  }

  // Numeric participant IDs frequently come back from the LLM unquoted, so a
  // number here is still an ID that needs resolving - keep it a number only if
  // nothing matched.
  if (typeof value === "number" && Number.isFinite(value)) {
    const resolved = replaceInText(String(value), replacements);
    return resolved === String(value) ? value : resolved;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepResolve(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        deepResolve(val, replacements),
      ])
    );
  }

  return value;
}

async function run({
  parameters: { content, participants },
}: {
  parameters: {
    content: unknown;
    participants: { id: string; name: string }[];
  };
}) {
  if (content === undefined || content === null) {
    return { error: "content is required" };
  }

  if (!participants?.length) {
    return { error: "participants array is required" };
  }

  // Longest IDs first, so an ID that is a prefix of another one never wins.
  const replacements = participants
    .filter(({ id, name }) => id != null && name != null)
    .map(({ id, name }) => [String(id), String(name)] as [string, string])
    .sort(([a], [b]) => b.length - a.length);

  return { content: deepResolve(content, replacements) };
}

export default { run };
