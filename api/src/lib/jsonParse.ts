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

// Some models (observed on Llama via Bedrock) occasionally drop the final
// closing brace(s) when emitting JSON as plain text. This repairs unbalanced
// braces/brackets (tracked outside of string literals) before re-parsing.
function repairUnbalancedJSON(content: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of content) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" && stack[stack.length - 1] === "{") stack.pop();
    else if (ch === "]" && stack[stack.length - 1] === "[") stack.pop();
  }

  if (stack.length === 0 && !inString) return null;

  let repaired = content;
  if (inString) repaired += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]";
  }
  return repaired;
}

// Quotes unquoted object keys (e.g. `{ next_step: ... }`) while tracking
// string literals, so `Word:` sequences inside string values are untouched —
// a plain regex would corrupt them.
function quoteUnquotedKeys(content: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];
    if (inString) {
      result += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
      i++;
      continue;
    }
    const keyMatch = /^([A-Za-z_$][\w$]*)(\s*:)/.exec(content.slice(i));
    if (keyMatch) {
      result += `"${keyMatch[1]}"${keyMatch[2]}`;
      i += keyMatch[0].length;
      continue;
    }
    result += ch;
    i++;
  }

  return result;
}

function parseWithBraceRepair(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const repaired = repairUnbalancedJSON(content);
    if (repaired) {
      try {
        return JSON.parse(repaired);
      } catch {
        /* fall through */
      }
    }
  }
  return undefined;
}

function unwrapSchemaValues(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    if ("type" in o && "value" in o) {
      return unwrapSchemaValues(o.value);
    }
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, unwrapSchemaValues(v)]),
    );
  }
  if (typeof obj === "string") {
    const trimmed = obj.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return unwrapSchemaValues(JSON.parse(trimmed));
      } catch {
        // not valid JSON, return as-is
      }
    }
  }
  return obj;
}

// Multi-strategy cascade for recovering JSON from a model response that
// doesn't parse cleanly: markdown-fenced blocks, the first JSON-like
// substring (optionally with unquoted keys fixed), and brace/bracket repair.
function parseJsonWithRepair(content: string, providerLabel: string): unknown {
  // Attempt 1: direct parse, tolerating a leading/trailing markdown fence.
  try {
    return parseJsonContent(content, providerLabel);
  } catch {
    /* fall through */
  }

  // Attempt 2: JSON inside a code block anywhere in the response
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Attempt 3: extract first JSON-like object/array, then try quoting unquoted keys
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      /* fall through */
    }

    const quoted = quoteUnquotedKeys(jsonMatch[1]);
    try {
      return JSON.parse(quoted);
    } catch {
      /* fall through */
    }

    // Quoted keys but still unbalanced braces — repair those too
    const quotedRepaired = repairUnbalancedJSON(quoted);
    if (quotedRepaired) {
      try {
        return JSON.parse(quotedRepaired);
      } catch {
        /* fall through */
      }
    }
  }

  // Attempt 4: repair unbalanced braces/brackets (e.g. a dropped closing brace)
  const repaired = repairUnbalancedJSON(content);
  if (repaired) {
    try {
      return JSON.parse(repaired);
    } catch {
      /* fall through */
    }
  }

  console.error(
    `Failed to parse ${providerLabel} response as JSON:`,
    content.substring(0, 500),
  );
  throw new SyntaxError(
    `Failed to parse ${providerLabel} response as JSON. Content starts with: ${content.substring(
      0,
      100,
    )}`,
  );
}

export {
  stripMarkdownFence,
  parseJsonContent,
  parseJsonWithRepair,
  parseWithBraceRepair,
  unwrapSchemaValues,
  repairUnbalancedJSON,
  quoteUnquotedKeys,
};
