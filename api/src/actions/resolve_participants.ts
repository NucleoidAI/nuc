function deepResolve(
  value: unknown,
  replacements: [string, string][]
): unknown {
  if (typeof value === "string") {
    return replacements.reduce(
      (text, [id, name]) => text.split(id).join(name),
      value
    );
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

  const replacements = participants.map(
    ({ id, name }) => [id, name] as [string, string]
  );

  return { content: deepResolve(content, replacements) };
}

export default { run };
