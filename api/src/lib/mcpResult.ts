function unwrapToolResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;

  const { content } = result as { content?: unknown };
  if (!Array.isArray(content)) return undefined;

  const texts = content
    .filter(
      (block): block is { type: string; text: string } =>
        Boolean(block) &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string"
    )
    .map((block) => block.text);

  if (texts.length === 0) return undefined;

  return texts.length === 1 ? texts[0] : JSON.stringify(texts);
}

export { unwrapToolResult };
