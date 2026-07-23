function stripMarkdownFence(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json|JSON)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function parseJsonContent(content: string, providerLabel: string): unknown {
  const cleaned = stripMarkdownFence(content);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse ${providerLabel} response as JSON: ` +
        (err instanceof Error ? err.message : String(err)) +
        "\nResponse content:\n" +
        cleaned,
    );
  }
}

export { stripMarkdownFence, parseJsonContent };
